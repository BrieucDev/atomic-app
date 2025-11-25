// ========================================
// GOALS SERVICE
// Logique métier pour les objectifs
// ========================================

const { query, transaction } = require('../config/database');

/**
 * Récupère tous les objectifs d'un utilisateur
 */
const getUserGoals = async (userId, options = {}) => {
  const { completed = null, category = null } = options;

  let queryText = `
    SELECT g.*,
      (SELECT COUNT(*) FROM goal_milestones WHERE goal_id = g.id) as total_milestones,
      (SELECT COUNT(*) FROM goal_milestones WHERE goal_id = g.id AND completed = TRUE) as completed_milestones
    FROM goals g
    WHERE g.user_id = $1
  `;
  const params = [userId];
  let paramCount = 2;

  if (completed !== null) {
    queryText += ` AND g.completed = $${paramCount}`;
    params.push(completed);
    paramCount++;
  }

  if (category) {
    queryText += ` AND g.category = $${paramCount}`;
    params.push(category);
    paramCount++;
  }

  queryText += ' ORDER BY g.created_at DESC';

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Récupère un objectif par ID
 */
const getGoalById = async (userId, goalId) => {
  const result = await query(
    `SELECT g.*,
      (SELECT COUNT(*) FROM goal_milestones WHERE goal_id = g.id) as total_milestones,
      (SELECT COUNT(*) FROM goal_milestones WHERE goal_id = g.id AND completed = TRUE) as completed_milestones
     FROM goals g
     WHERE g.id = $1 AND g.user_id = $2`,
    [goalId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Goal not found');
  }

  return result.rows[0];
};

/**
 * Crée un nouveau goal
 */
const createGoal = async (userId, goalData) => {
  const {
    title,
    description,
    category,
    target_date,
    linked_habit_id,
    milestones = []
  } = goalData;

  return await transaction(async (client) => {
    // Créer le goal
    const goalResult = await client.query(
      `INSERT INTO goals (user_id, title, description, category, target_date, linked_habit_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, description || null, category || 'personal', target_date || null, linked_habit_id || null]
    );

    const goal = goalResult.rows[0];

    // Créer les milestones si fournis
    if (milestones.length > 0) {
      for (const milestone of milestones) {
        await client.query(
          `INSERT INTO goal_milestones (goal_id, title, description, order_index)
           VALUES ($1, $2, $3, $4)`,
          [goal.id, milestone.title, milestone.description || null, milestone.order_index || 0]
        );
      }
    }

    return goal;
  });
};

/**
 * Met à jour un objectif
 */
const updateGoal = async (userId, goalId, updates) => {
  const {
    title,
    description,
    category,
    target_date,
    linked_habit_id
  } = updates;

  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (title !== undefined) {
    updateFields.push(`title = $${paramCount}`);
    values.push(title);
    paramCount++;
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }

  if (category !== undefined) {
    updateFields.push(`category = $${paramCount}`);
    values.push(category);
    paramCount++;
  }

  if (target_date !== undefined) {
    updateFields.push(`target_date = $${paramCount}`);
    values.push(target_date);
    paramCount++;
  }

  if (linked_habit_id !== undefined) {
    updateFields.push(`linked_habit_id = $${paramCount}`);
    values.push(linked_habit_id);
    paramCount++;
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(goalId, userId);
  const updateQuery = `
    UPDATE goals
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING *
  `;

  const result = await query(updateQuery, values);

  if (result.rows.length === 0) {
    throw new Error('Goal not found');
  }

  return result.rows[0];
};

/**
 * Marque un objectif comme complété
 */
const completeGoal = async (userId, goalId) => {
  return await transaction(async (client) => {
    // Vérifier que le goal existe
    const goalResult = await client.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalResult.rows.length === 0) {
      throw new Error('Goal not found');
    }

    // Marquer comme complété
    const result = await client.query(
      `UPDATE goals
       SET completed = TRUE, completed_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [goalId]
    );

    // Log audit
    await client.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'goal_completed', JSON.stringify({ goal_id: goalId })]
    );

    return result.rows[0];
  });
};

/**
 * Rouvre un objectif complété
 */
const reopenGoal = async (userId, goalId) => {
  const result = await query(
    `UPDATE goals
     SET completed = FALSE, completed_at = NULL, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [goalId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Goal not found');
  }

  return result.rows[0];
};

/**
 * Supprime un objectif
 */
const deleteGoal = async (userId, goalId) => {
  await transaction(async (client) => {
    // Vérifier que le goal existe
    const goalResult = await client.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (goalResult.rows.length === 0) {
      throw new Error('Goal not found');
    }

    // Supprimer les milestones
    await client.query(
      'DELETE FROM goal_milestones WHERE goal_id = $1',
      [goalId]
    );

    // Supprimer le goal
    await client.query(
      'DELETE FROM goals WHERE id = $1',
      [goalId]
    );
  });
};

/**
 * Récupère les milestones d'un objectif
 */
const getGoalMilestones = async (userId, goalId) => {
  // Vérifier que le goal appartient à l'utilisateur
  const goalResult = await query(
    'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
    [goalId, userId]
  );

  if (goalResult.rows.length === 0) {
    throw new Error('Goal not found');
  }

  const result = await query(
    'SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY order_index, created_at',
    [goalId]
  );

  return result.rows;
};

/**
 * Crée un milestone
 */
const createMilestone = async (userId, goalId, milestoneData) => {
  const { title, description, order_index } = milestoneData;

  // Vérifier que le goal appartient à l'utilisateur
  const goalResult = await query(
    'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
    [goalId, userId]
  );

  if (goalResult.rows.length === 0) {
    throw new Error('Goal not found');
  }

  const result = await query(
    `INSERT INTO goal_milestones (goal_id, title, description, order_index)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [goalId, title, description || null, order_index || 0]
  );

  return result.rows[0];
};

/**
 * Met à jour un milestone
 */
const updateMilestone = async (userId, milestoneId, updates) => {
  const { title, description, order_index } = updates;

  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (title !== undefined) {
    updateFields.push(`title = $${paramCount}`);
    values.push(title);
    paramCount++;
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }

  if (order_index !== undefined) {
    updateFields.push(`order_index = $${paramCount}`);
    values.push(order_index);
    paramCount++;
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(milestoneId);

  // Vérifier que le milestone appartient à un goal de l'utilisateur
  const verifyQuery = `
    SELECT gm.id FROM goal_milestones gm
    JOIN goals g ON gm.goal_id = g.id
    WHERE gm.id = $${paramCount} AND g.user_id = $${paramCount + 1}
  `;
  values.push(userId);
  const verifyResult = await query(verifyQuery, [milestoneId, userId]);

  if (verifyResult.rows.length === 0) {
    throw new Error('Milestone not found');
  }

  values.pop(); // Enlever userId pour l'update
  const updateQuery = `
    UPDATE goal_milestones
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(updateQuery, values);
  return result.rows[0];
};

/**
 * Marque un milestone comme complété
 */
const completeMilestone = async (userId, milestoneId) => {
  return await transaction(async (client) => {
    // Vérifier que le milestone appartient à un goal de l'utilisateur
    const verifyResult = await client.query(
      `SELECT gm.id, gm.goal_id FROM goal_milestones gm
       JOIN goals g ON gm.goal_id = g.id
       WHERE gm.id = $1 AND g.user_id = $2`,
      [milestoneId, userId]
    );

    if (verifyResult.rows.length === 0) {
      throw new Error('Milestone not found');
    }

    const milestone = verifyResult.rows[0];

    // Marquer comme complété
    const result = await client.query(
      `UPDATE goal_milestones
       SET completed = TRUE, completed_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [milestoneId]
    );

    // Vérifier si tous les milestones du goal sont complétés
    const allMilestonesResult = await client.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed FROM goal_milestones WHERE goal_id = $1',
      [milestone.goal_id]
    );

    const stats = allMilestonesResult.rows[0];
    if (parseInt(stats.total) === parseInt(stats.completed)) {
      // Tous les milestones sont complétés, marquer le goal comme complété
      await client.query(
        'UPDATE goals SET completed = TRUE, completed_at = NOW(), updated_at = NOW() WHERE id = $1',
        [milestone.goal_id]
      );
    }

    return result.rows[0];
  });
};

/**
 * Rouvre un milestone complété
 */
const reopenMilestone = async (userId, milestoneId) => {
  return await transaction(async (client) => {
    // Vérifier que le milestone appartient à un goal de l'utilisateur
    const verifyResult = await client.query(
      `SELECT gm.id, gm.goal_id FROM goal_milestones gm
       JOIN goals g ON gm.goal_id = g.id
       WHERE gm.id = $1 AND g.user_id = $2`,
      [milestoneId, userId]
    );

    if (verifyResult.rows.length === 0) {
      throw new Error('Milestone not found');
    }

    const milestone = verifyResult.rows[0];

    // Marquer comme non complété
    const result = await client.query(
      `UPDATE goal_milestones
       SET completed = FALSE, completed_at = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [milestoneId]
    );

    // Rouvrir le goal s'il était complété
    await client.query(
      'UPDATE goals SET completed = FALSE, completed_at = NULL, updated_at = NOW() WHERE id = $1',
      [milestone.goal_id]
    );

    return result.rows[0];
  });
};

/**
 * Supprime un milestone
 */
const deleteMilestone = async (userId, milestoneId) => {
  // Vérifier que le milestone appartient à un goal de l'utilisateur
  const verifyResult = await query(
    `SELECT gm.id FROM goal_milestones gm
     JOIN goals g ON gm.goal_id = g.id
     WHERE gm.id = $1 AND g.user_id = $2`,
    [milestoneId, userId]
  );

  if (verifyResult.rows.length === 0) {
    throw new Error('Milestone not found');
  }

  await query('DELETE FROM goal_milestones WHERE id = $1', [milestoneId]);
};

/**
 * Récupère la progression d'un objectif
 */
const getGoalProgress = async (userId, goalId) => {
  const goal = await getGoalById(userId, goalId);

  // Calculer le pourcentage de progression
  const totalMilestones = parseInt(goal.total_milestones);
  const completedMilestones = parseInt(goal.completed_milestones);

  const progress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  // Calculer les jours restants si target_date existe
  let daysRemaining = null;
  if (goal.target_date) {
    const today = new Date();
    const target = new Date(goal.target_date);
    const diffTime = target.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    goal_id: goal.id,
    title: goal.title,
    completed: goal.completed,
    progress_percentage: progress,
    total_milestones: totalMilestones,
    completed_milestones: completedMilestones,
    target_date: goal.target_date,
    days_remaining: daysRemaining,
    created_at: goal.created_at,
    completed_at: goal.completed_at
  };
};

module.exports = {
  getUserGoals,
  getGoalById,
  createGoal,
  updateGoal,
  completeGoal,
  reopenGoal,
  deleteGoal,
  getGoalMilestones,
  createMilestone,
  updateMilestone,
  completeMilestone,
  reopenMilestone,
  deleteMilestone,
  getGoalProgress
};
