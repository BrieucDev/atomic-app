// ========================================
// HABITS SERVICE
// Logique métier pour les habitudes
// ========================================

const { query, transaction } = require('../config/database');

/**
 * Récupère toutes les habitudes d'un utilisateur
 */
const getUserHabits = async (userId, options = {}) => {
  const { archived = false, category = null } = options;

  let queryText = `
    SELECT * FROM habits
    WHERE user_id = $1 AND archived = $2
  `;
  const params = [userId, archived];

  if (category) {
    queryText += ' AND category = $3';
    params.push(category);
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Récupère une habitude par ID
 */
const getHabitById = async (userId, habitId) => {
  const result = await query(
    'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
    [habitId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Habit not found');
  }

  return result.rows[0];
};

/**
 * Crée une nouvelle habitude
 */
const createHabit = async (userId, habitData) => {
  const {
    name,
    icon,
    color,
    category,
    frequency_type,
    frequency_value,
    reminder_enabled,
    reminder_time
  } = habitData;

  const result = await query(
    `INSERT INTO habits (
      user_id, name, icon, color, category,
      frequency_type, frequency_value,
      reminder_enabled, reminder_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      userId,
      name,
      icon || 'star',
      color || '#6366f1',
      category || 'health',
      frequency_type || 'daily',
      frequency_value || '{}',
      reminder_enabled || false,
      reminder_time
    ]
  );

  return result.rows[0];
};

/**
 * Met à jour une habitude
 */
const updateHabit = async (userId, habitId, updates) => {
  const {
    name,
    icon,
    color,
    category,
    frequency_type,
    frequency_value,
    reminder_enabled,
    reminder_time
  } = updates;

  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updateFields.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (icon !== undefined) {
    updateFields.push(`icon = $${paramCount}`);
    values.push(icon);
    paramCount++;
  }

  if (color !== undefined) {
    updateFields.push(`color = $${paramCount}`);
    values.push(color);
    paramCount++;
  }

  if (category !== undefined) {
    updateFields.push(`category = $${paramCount}`);
    values.push(category);
    paramCount++;
  }

  if (frequency_type !== undefined) {
    updateFields.push(`frequency_type = $${paramCount}`);
    values.push(frequency_type);
    paramCount++;
  }

  if (frequency_value !== undefined) {
    updateFields.push(`frequency_value = $${paramCount}`);
    values.push(frequency_value);
    paramCount++;
  }

  if (reminder_enabled !== undefined) {
    updateFields.push(`reminder_enabled = $${paramCount}`);
    values.push(reminder_enabled);
    paramCount++;
  }

  if (reminder_time !== undefined) {
    updateFields.push(`reminder_time = $${paramCount}`);
    values.push(reminder_time);
    paramCount++;
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(habitId, userId);
  const updateQuery = `
    UPDATE habits
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING *
  `;

  const result = await query(updateQuery, values);

  if (result.rows.length === 0) {
    throw new Error('Habit not found');
  }

  return result.rows[0];
};

/**
 * Archive une habitude
 */
const archiveHabit = async (userId, habitId) => {
  const result = await query(
    'UPDATE habits SET archived = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
    [habitId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Habit not found');
  }

  return result.rows[0];
};

/**
 * Supprime une habitude
 */
const deleteHabit = async (userId, habitId) => {
  await transaction(async (client) => {
    // Vérifier que l'habitude appartient à l'utilisateur
    const habitResult = await client.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, userId]
    );

    if (habitResult.rows.length === 0) {
      throw new Error('Habit not found');
    }

    // Supprimer les check-ins
    await client.query(
      'DELETE FROM habit_checkins WHERE habit_id = $1',
      [habitId]
    );

    // Supprimer l'habitude
    await client.query(
      'DELETE FROM habits WHERE id = $1',
      [habitId]
    );
  });
};

/**
 * Enregistre un check-in pour une habitude
 */
const checkInHabit = async (userId, habitId, checkinData = {}) => {
  const { date = new Date(), note = null } = checkinData;

  return await transaction(async (client) => {
    // Vérifier que l'habitude existe
    const habitResult = await client.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, userId]
    );

    if (habitResult.rows.length === 0) {
      throw new Error('Habit not found');
    }

    const habit = habitResult.rows[0];

    // Vérifier si un check-in existe déjà pour cette date
    const checkinDate = new Date(date);
    checkinDate.setHours(0, 0, 0, 0);

    const existingCheckin = await client.query(
      'SELECT id FROM habit_checkins WHERE habit_id = $1 AND user_id = $2 AND checkin_date = $3',
      [habitId, userId, checkinDate]
    );

    if (existingCheckin.rows.length > 0) {
      throw new Error('Check-in already exists for this date');
    }

    // Créer le check-in
    const checkinResult = await client.query(
      `INSERT INTO habit_checkins (habit_id, user_id, checkin_date, note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [habitId, userId, checkinDate, note]
    );

    // Calculer la nouvelle streak
    const newStreak = await calculateStreak(client, habitId, userId);

    // Mettre à jour l'habitude
    await client.query(
      `UPDATE habits
       SET current_streak = $1,
           longest_streak = GREATEST(longest_streak, $1),
           total_completions = total_completions + 1,
           last_completed_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [newStreak, checkinDate, habitId]
    );

    return checkinResult.rows[0];
  });
};

/**
 * Supprime un check-in
 */
const undoCheckIn = async (userId, habitId, date) => {
  return await transaction(async (client) => {
    const checkinDate = new Date(date);
    checkinDate.setHours(0, 0, 0, 0);

    // Supprimer le check-in
    const result = await client.query(
      'DELETE FROM habit_checkins WHERE habit_id = $1 AND user_id = $2 AND checkin_date = $3 RETURNING *',
      [habitId, userId, checkinDate]
    );

    if (result.rows.length === 0) {
      throw new Error('Check-in not found');
    }

    // Recalculer la streak
    const newStreak = await calculateStreak(client, habitId, userId);

    // Mettre à jour l'habitude
    await client.query(
      `UPDATE habits
       SET current_streak = $1,
           total_completions = total_completions - 1,
           updated_at = NOW()
       WHERE id = $2`,
      [newStreak, habitId]
    );

    return result.rows[0];
  });
};

/**
 * Récupère les check-ins d'une habitude
 */
const getHabitCheckins = async (userId, habitId, options = {}) => {
  const { startDate = null, endDate = null, limit = 100 } = options;

  let queryText = `
    SELECT * FROM habit_checkins
    WHERE habit_id = $1 AND user_id = $2
  `;
  const params = [habitId, userId];
  let paramCount = 3;

  if (startDate) {
    queryText += ` AND checkin_date >= $${paramCount}`;
    params.push(startDate);
    paramCount++;
  }

  if (endDate) {
    queryText += ` AND checkin_date <= $${paramCount}`;
    params.push(endDate);
    paramCount++;
  }

  queryText += ' ORDER BY checkin_date DESC';

  if (limit) {
    queryText += ` LIMIT $${paramCount}`;
    params.push(limit);
  }

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Récupère les statistiques d'une habitude
 */
const getHabitStats = async (userId, habitId) => {
  const habit = await getHabitById(userId, habitId);

  // Check-ins des 30 derniers jours
  const last30Days = await query(
    `SELECT checkin_date FROM habit_checkins
     WHERE habit_id = $1 AND user_id = $2
     AND checkin_date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY checkin_date`,
    [habitId, userId]
  );

  // Taux de complétion
  const completionRate = habit.frequency_type === 'daily'
    ? (last30Days.rows.length / 30) * 100
    : 0;

  return {
    habit_id: habit.id,
    name: habit.name,
    current_streak: habit.current_streak,
    longest_streak: habit.longest_streak,
    total_completions: habit.total_completions,
    last_completed_at: habit.last_completed_at,
    completion_rate_30d: Math.round(completionRate),
    checkins_30d: last30Days.rows.length,
    created_at: habit.created_at
  };
};

/**
 * Calcule la streak actuelle d'une habitude
 * @private
 */
const calculateStreak = async (client, habitId, userId) => {
  // Récupérer tous les check-ins triés par date DESC
  const result = await client.query(
    `SELECT checkin_date FROM habit_checkins
     WHERE habit_id = $1 AND user_id = $2
     ORDER BY checkin_date DESC`,
    [habitId, userId]
  );

  if (result.rows.length === 0) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);

  for (const row of result.rows) {
    const checkinDate = new Date(row.checkin_date);
    checkinDate.setHours(0, 0, 0, 0);

    // Si le check-in correspond à la date attendue
    if (checkinDate.getTime() === expectedDate.getTime()) {
      streak++;
      // Passer au jour précédent
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (checkinDate.getTime() < expectedDate.getTime()) {
      // Si le check-in est plus ancien que la date attendue, la streak est brisée
      break;
    }
  }

  return streak;
};

/**
 * Récupère le calendrier des check-ins (pour vue calendrier)
 */
const getHabitCalendar = async (userId, habitId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const result = await query(
    `SELECT checkin_date, note FROM habit_checkins
     WHERE habit_id = $1 AND user_id = $2
     AND checkin_date >= $3 AND checkin_date <= $4
     ORDER BY checkin_date`,
    [habitId, userId, startDate, endDate]
  );

  return result.rows;
};

module.exports = {
  getUserHabits,
  getHabitById,
  createHabit,
  updateHabit,
  archiveHabit,
  deleteHabit,
  checkInHabit,
  undoCheckIn,
  getHabitCheckins,
  getHabitStats,
  getHabitCalendar
};
