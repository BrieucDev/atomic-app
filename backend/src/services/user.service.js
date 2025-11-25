// ========================================
// USER SERVICE
// Logique métier pour la gestion du profil utilisateur
// ========================================

const { query, transaction } = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/password');
const fs = require('fs').promises;
const path = require('path');

/**
 * Récupère le profil complet d'un utilisateur
 */
const getUserProfile = async (userId) => {
  const result = await query(
    `SELECT
      u.id, u.email, u.email_verified, u.name, u.profile_picture,
      u.auth_provider, u.created_at, u.last_login_at,
      us.theme, us.notifications_enabled, us.reminder_time,
      us.reminder_days, us.language
     FROM users u
     LEFT JOIN user_settings us ON u.id = us.user_id
     WHERE u.id = $1 AND u.is_deleted = FALSE`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

/**
 * Met à jour le profil utilisateur
 */
const updateProfile = async (userId, { name, profile_picture }) => {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (profile_picture !== undefined) {
    updates.push(`profile_picture = $${paramCount}`);
    values.push(profile_picture);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(userId);
  const updateQuery = `
    UPDATE users
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount} AND is_deleted = FALSE
    RETURNING id, email, name, profile_picture
  `;

  const result = await query(updateQuery, values);

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

/**
 * Met à jour les paramètres utilisateur
 */
const updateSettings = async (userId, settings) => {
  const {
    theme,
    notifications_enabled,
    reminder_time,
    reminder_days,
    language
  } = settings;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (theme !== undefined) {
    updates.push(`theme = $${paramCount}`);
    values.push(theme);
    paramCount++;
  }

  if (notifications_enabled !== undefined) {
    updates.push(`notifications_enabled = $${paramCount}`);
    values.push(notifications_enabled);
    paramCount++;
  }

  if (reminder_time !== undefined) {
    updates.push(`reminder_time = $${paramCount}`);
    values.push(reminder_time);
    paramCount++;
  }

  if (reminder_days !== undefined) {
    updates.push(`reminder_days = $${paramCount}`);
    values.push(reminder_days);
    paramCount++;
  }

  if (language !== undefined) {
    updates.push(`language = $${paramCount}`);
    values.push(language);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new Error('No settings to update');
  }

  values.push(userId);
  const updateQuery = `
    UPDATE user_settings
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE user_id = $${paramCount}
    RETURNING *
  `;

  const result = await query(updateQuery, values);

  if (result.rows.length === 0) {
    throw new Error('Settings not found');
  }

  return result.rows[0];
};

/**
 * Change le mot de passe
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Récupérer le hash actuel
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1 AND is_deleted = FALSE',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  // Vérifier le mot de passe actuel
  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hasher le nouveau mot de passe
  const newHash = await hashPassword(newPassword);

  await transaction(async (client) => {
    // Mettre à jour le mot de passe
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    // Révoquer tous les refresh tokens
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );

    // Log audit
    await client.query(
      'INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)',
      [userId, 'password_changed']
    );
  });
};

/**
 * Change l'email
 */
const changeEmail = async (userId, newEmail, password) => {
  return await transaction(async (client) => {
    // Vérifier le mot de passe
    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_deleted = FALSE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const isValid = await verifyPassword(password, userResult.rows[0].password_hash);
    if (!isValid) {
      throw new Error('Password is incorrect');
    }

    // Vérifier que le nouvel email n'existe pas déjà
    const existingEmail = await client.query(
      'SELECT id FROM users WHERE email = $1 AND is_deleted = FALSE',
      [newEmail.toLowerCase()]
    );

    if (existingEmail.rows.length > 0) {
      throw new Error('Email already in use');
    }

    // Mettre à jour l'email
    await client.query(
      'UPDATE users SET email = $1, email_verified = FALSE, updated_at = NOW() WHERE id = $2',
      [newEmail.toLowerCase(), userId]
    );

    // Générer un nouveau token de vérification
    const { generateEmailVerificationToken } = require('../config/jwt');
    const { sendVerificationEmail } = require('../utils/email');

    const verificationToken = generateEmailVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await client.query(
      'INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, verificationToken, expiresAt]
    );

    // Envoyer l'email de vérification
    const userNameResult = await client.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );
    await sendVerificationEmail(newEmail, verificationToken, userNameResult.rows[0].name);

    // Log audit
    await client.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'email_changed', JSON.stringify({ new_email: newEmail })]
    );
  });
};

/**
 * Enregistre un device pour push notifications
 */
const registerDevice = async (userId, { device_token, device_type, device_name }) => {
  // Vérifier si le device existe déjà
  const existing = await query(
    'SELECT id FROM devices WHERE user_id = $1 AND device_token = $2',
    [userId, device_token]
  );

  if (existing.rows.length > 0) {
    // Mettre à jour last_active_at
    const result = await query(
      'UPDATE devices SET last_active_at = NOW() WHERE id = $1 RETURNING *',
      [existing.rows[0].id]
    );
    return result.rows[0];
  }

  // Créer un nouveau device
  const result = await query(
    `INSERT INTO devices (user_id, device_token, device_type, device_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, device_token, device_type, device_name || 'iPhone']
  );

  return result.rows[0];
};

/**
 * Supprime un device
 */
const unregisterDevice = async (userId, deviceToken) => {
  await query(
    'DELETE FROM devices WHERE user_id = $1 AND device_token = $2',
    [userId, deviceToken]
  );
};

/**
 * Export des données utilisateur (RGPD)
 */
const exportUserData = async (userId) => {
  const data = {};

  // Profil utilisateur
  const userResult = await query(
    'SELECT id, email, name, created_at, last_login_at FROM users WHERE id = $1',
    [userId]
  );
  data.profile = userResult.rows[0];

  // Settings
  const settingsResult = await query(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [userId]
  );
  data.settings = settingsResult.rows[0];

  // Habitudes
  const habitsResult = await query(
    'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  data.habits = habitsResult.rows;

  // Check-ins
  const checkinsResult = await query(
    'SELECT * FROM habit_checkins WHERE user_id = $1 ORDER BY checkin_date',
    [userId]
  );
  data.checkins = checkinsResult.rows;

  // Objectifs
  const goalsResult = await query(
    'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  data.goals = goalsResult.rows;

  // Badges
  const badgesResult = await query(
    `SELECT ub.*, bt.name, bt.description
     FROM user_badges ub
     JOIN badge_templates bt ON ub.badge_template_id = bt.id
     WHERE ub.user_id = $1
     ORDER BY ub.unlocked_at`,
    [userId]
  );
  data.badges = badgesResult.rows;

  return data;
};

/**
 * Suppression du compte (soft delete)
 */
const deleteAccount = async (userId, password) => {
  return await transaction(async (client) => {
    // Vérifier le mot de passe
    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_deleted = FALSE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    if (userResult.rows[0].password_hash) {
      const isValid = await verifyPassword(password, userResult.rows[0].password_hash);
      if (!isValid) {
        throw new Error('Password is incorrect');
      }
    }

    // Soft delete du user
    await client.query(
      'UPDATE users SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1',
      [userId]
    );

    // Révoquer tous les tokens
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );

    // Supprimer les devices
    await client.query(
      'DELETE FROM devices WHERE user_id = $1',
      [userId]
    );

    // Log audit
    await client.query(
      'INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)',
      [userId, 'account_deleted']
    );
  });
};

/**
 * Récupère les statistiques utilisateur
 */
const getUserStats = async (userId) => {
  // Nombre total d'habitudes
  const habitsResult = await query(
    'SELECT COUNT(*) as total FROM habits WHERE user_id = $1 AND archived = FALSE',
    [userId]
  );

  // Nombre de check-ins ce mois
  const checkinsResult = await query(
    `SELECT COUNT(*) as total FROM habit_checkins
     WHERE user_id = $1
     AND checkin_date >= DATE_TRUNC('month', CURRENT_DATE)`,
    [userId]
  );

  // Streak actuelle (plus longue)
  const streakResult = await query(
    'SELECT MAX(current_streak) as longest FROM habits WHERE user_id = $1',
    [userId]
  );

  // Nombre de badges
  const badgesResult = await query(
    'SELECT COUNT(*) as total FROM user_badges WHERE user_id = $1',
    [userId]
  );

  // Objectifs complétés
  const goalsResult = await query(
    'SELECT COUNT(*) as total FROM goals WHERE user_id = $1 AND completed = TRUE',
    [userId]
  );

  return {
    total_habits: parseInt(habitsResult.rows[0].total),
    checkins_this_month: parseInt(checkinsResult.rows[0].total),
    longest_streak: parseInt(streakResult.rows[0].longest) || 0,
    total_badges: parseInt(badgesResult.rows[0].total),
    completed_goals: parseInt(goalsResult.rows[0].total)
  };
};

module.exports = {
  getUserProfile,
  updateProfile,
  updateSettings,
  changePassword,
  changeEmail,
  registerDevice,
  unregisterDevice,
  exportUserData,
  deleteAccount,
  getUserStats
};
