// ========================================
// BADGES SERVICE
// Logique métier pour les badges et achievements
// ========================================

const { query, transaction } = require('../config/database');

/**
 * Récupère tous les badges d'un utilisateur
 */
const getUserBadges = async (userId) => {
  const result = await query(
    `SELECT ub.*, bt.name, bt.description, bt.icon, bt.category
     FROM user_badges ub
     JOIN badge_templates bt ON ub.badge_template_id = bt.id
     WHERE ub.user_id = $1
     ORDER BY ub.unlocked_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Récupère tous les badge templates disponibles
 */
const getAllBadgeTemplates = async () => {
  const result = await query(
    'SELECT * FROM badge_templates ORDER BY category, name'
  );

  return result.rows;
};

/**
 * Récupère les badges disponibles avec le statut de déblocage pour un utilisateur
 */
const getBadgesWithStatus = async (userId) => {
  const result = await query(
    `SELECT
      bt.*,
      ub.id as user_badge_id,
      ub.unlocked_at,
      CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as unlocked
     FROM badge_templates bt
     LEFT JOIN user_badges ub ON bt.id = ub.badge_template_id AND ub.user_id = $1
     ORDER BY bt.category, bt.name`,
    [userId]
  );

  return result.rows;
};

/**
 * Vérifie et débloque les badges pour un utilisateur
 * Cette fonction est appelée après chaque check-in ou action importante
 */
const checkAndUnlockBadges = async (userId) => {
  const unlockedBadges = [];

  // Récupérer les templates de badges non encore débloqués
  const templatesResult = await query(
    `SELECT bt.* FROM badge_templates bt
     WHERE bt.id NOT IN (
       SELECT badge_template_id FROM user_badges WHERE user_id = $1
     )`,
    [userId]
  );

  for (const template of templatesResult.rows) {
    const unlocked = await checkBadgeCriteria(userId, template);
    if (unlocked) {
      const badge = await unlockBadge(userId, template.id);
      unlockedBadges.push(badge);
    }
  }

  return unlockedBadges;
};

/**
 * Vérifie si un badge doit être débloqué selon ses critères
 * @private
 */
const checkBadgeCriteria = async (userId, template) => {
  const criteria = template.criteria;

  // First Habit: Créer sa première habitude
  if (template.id === '00000000-0000-0000-0000-000000000001') {
    const result = await query(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count) >= 1;
  }

  // First Checkin: Valider sa première habitude
  if (template.id === '00000000-0000-0000-0000-000000000002') {
    const result = await query(
      'SELECT COUNT(*) as count FROM habit_checkins WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count) >= 1;
  }

  // Week Warrior: 7 jours consécutifs
  if (template.id === '00000000-0000-0000-0000-000000000003') {
    const result = await query(
      'SELECT MAX(current_streak) as max_streak FROM habits WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].max_streak) >= 7;
  }

  // Month Master: 30 jours consécutifs
  if (template.id === '00000000-0000-0000-0000-000000000004') {
    const result = await query(
      'SELECT MAX(current_streak) as max_streak FROM habits WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].max_streak) >= 30;
  }

  // Century Club: 100 check-ins au total
  if (template.id === '00000000-0000-0000-0000-000000000005') {
    const result = await query(
      'SELECT COUNT(*) as count FROM habit_checkins WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count) >= 100;
  }

  // Goal Getter: Compléter son premier objectif
  if (template.id === '00000000-0000-0000-0000-000000000006') {
    const result = await query(
      'SELECT COUNT(*) as count FROM goals WHERE user_id = $1 AND completed = TRUE',
      [userId]
    );
    return parseInt(result.rows[0].count) >= 1;
  }

  // Multi-Tasker: 5 habitudes actives en même temps
  if (template.id === '00000000-0000-0000-0000-000000000007') {
    const result = await query(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND archived = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count) >= 5;
  }

  // Early Bird: Check-in avant 7h du matin (au moins 10 fois)
  if (template.id === '00000000-0000-0000-0000-000000000008') {
    const result = await query(
      `SELECT COUNT(*) as count FROM habit_checkins
       WHERE user_id = $1
       AND EXTRACT(HOUR FROM created_at) < 7`,
      [userId]
    );
    return parseInt(result.rows[0].count) >= 10;
  }

  // Perfect Week: Toutes les habitudes validées chaque jour pendant 7 jours
  if (template.id === '00000000-0000-0000-0000-000000000009') {
    // Compter le nombre d'habitudes actives
    const habitsResult = await query(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND archived = FALSE',
      [userId]
    );
    const habitCount = parseInt(habitsResult.rows[0].count);

    if (habitCount === 0) return false;

    // Vérifier les 7 derniers jours
    const checkinsResult = await query(
      `SELECT checkin_date, COUNT(DISTINCT habit_id) as habits_checked
       FROM habit_checkins
       WHERE user_id = $1
       AND checkin_date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY checkin_date
       ORDER BY checkin_date DESC
       LIMIT 7`,
      [userId]
    );

    if (checkinsResult.rows.length < 7) return false;

    // Vérifier que chaque jour a tous les check-ins
    for (const row of checkinsResult.rows) {
      if (parseInt(row.habits_checked) < habitCount) {
        return false;
      }
    }

    return true;
  }

  return false;
};

/**
 * Débloque un badge pour un utilisateur
 * @private
 */
const unlockBadge = async (userId, badgeTemplateId) => {
  return await transaction(async (client) => {
    // Vérifier que le badge n'est pas déjà débloqué
    const existingResult = await client.query(
      'SELECT id FROM user_badges WHERE user_id = $1 AND badge_template_id = $2',
      [userId, badgeTemplateId]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Badge already unlocked');
    }

    // Débloquer le badge
    const badgeResult = await client.query(
      `INSERT INTO user_badges (user_id, badge_template_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, badgeTemplateId]
    );

    // Récupérer les infos du template
    const templateResult = await client.query(
      'SELECT name, description, icon FROM badge_templates WHERE id = $1',
      [badgeTemplateId]
    );

    const badge = {
      ...badgeResult.rows[0],
      ...templateResult.rows[0]
    };

    // Log audit
    await client.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'badge_unlocked', JSON.stringify({ badge_id: badge.id, badge_name: badge.name })]
    );

    return badge;
  });
};

/**
 * Récupère les statistiques de badges pour un utilisateur
 */
const getBadgeStats = async (userId) => {
  // Nombre total de badges disponibles
  const totalResult = await query(
    'SELECT COUNT(*) as total FROM badge_templates'
  );

  // Nombre de badges débloqués
  const unlockedResult = await query(
    'SELECT COUNT(*) as unlocked FROM user_badges WHERE user_id = $1',
    [userId]
  );

  // Dernier badge débloqué
  const lastBadgeResult = await query(
    `SELECT ub.unlocked_at, bt.name, bt.icon
     FROM user_badges ub
     JOIN badge_templates bt ON ub.badge_template_id = bt.id
     WHERE ub.user_id = $1
     ORDER BY ub.unlocked_at DESC
     LIMIT 1`,
    [userId]
  );

  const total = parseInt(totalResult.rows[0].total);
  const unlocked = parseInt(unlockedResult.rows[0].unlocked);

  return {
    total_badges: total,
    unlocked_badges: unlocked,
    locked_badges: total - unlocked,
    completion_percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    last_badge: lastBadgeResult.rows.length > 0 ? lastBadgeResult.rows[0] : null
  };
};

/**
 * Récupère la progression vers les prochains badges
 */
const getNextBadgesProgress = async (userId) => {
  const progress = [];

  // Week Warrior (7 jours de streak)
  const weekWarriorResult = await query(
    'SELECT MAX(current_streak) as max_streak FROM habits WHERE user_id = $1',
    [userId]
  );
  const weekWarriorStreak = parseInt(weekWarriorResult.rows[0].max_streak) || 0;
  if (weekWarriorStreak < 7) {
    progress.push({
      badge_name: 'Week Warrior',
      current: weekWarriorStreak,
      target: 7,
      percentage: Math.round((weekWarriorStreak / 7) * 100)
    });
  }

  // Month Master (30 jours de streak)
  const monthMasterStreak = parseInt(weekWarriorResult.rows[0].max_streak) || 0;
  if (monthMasterStreak < 30) {
    progress.push({
      badge_name: 'Month Master',
      current: monthMasterStreak,
      target: 30,
      percentage: Math.round((monthMasterStreak / 30) * 100)
    });
  }

  // Century Club (100 check-ins)
  const centuryResult = await query(
    'SELECT COUNT(*) as count FROM habit_checkins WHERE user_id = $1',
    [userId]
  );
  const centuryCount = parseInt(centuryResult.rows[0].count);
  if (centuryCount < 100) {
    progress.push({
      badge_name: 'Century Club',
      current: centuryCount,
      target: 100,
      percentage: Math.round((centuryCount / 100) * 100)
    });
  }

  // Multi-Tasker (5 habitudes actives)
  const multiTaskerResult = await query(
    'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND archived = FALSE',
    [userId]
  );
  const multiTaskerCount = parseInt(multiTaskerResult.rows[0].count);
  if (multiTaskerCount < 5) {
    progress.push({
      badge_name: 'Multi-Tasker',
      current: multiTaskerCount,
      target: 5,
      percentage: Math.round((multiTaskerCount / 5) * 100)
    });
  }

  return progress;
};

module.exports = {
  getUserBadges,
  getAllBadgeTemplates,
  getBadgesWithStatus,
  checkAndUnlockBadges,
  getBadgeStats,
  getNextBadgesProgress
};
