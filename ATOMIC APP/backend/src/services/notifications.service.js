// ========================================
// NOTIFICATIONS SERVICE
// Envoi de push notifications iOS via APNs
// ========================================

const apn = require('apn');
const { query } = require('../config/database');

// Configuration APNs
let apnProvider = null;

const initializeAPNs = () => {
  if (apnProvider) return apnProvider;

  const options = {
    token: {
      key: process.env.APNS_KEY_PATH,
      keyId: process.env.APNS_KEY_ID,
      teamId: process.env.APNS_TEAM_ID
    },
    production: process.env.NODE_ENV === 'production'
  };

  apnProvider = new apn.Provider(options);
  return apnProvider;
};

/**
 * Envoie une notification push à un utilisateur
 */
const sendPushNotification = async (userId, notification) => {
  const { title, body, data = {} } = notification;

  try {
    // Récupérer les devices de l'utilisateur
    const devicesResult = await query(
      'SELECT device_token FROM devices WHERE user_id = $1 AND device_type = $2',
      [userId, 'ios']
    );

    if (devicesResult.rows.length === 0) {
      console.log(`No devices found for user ${userId}`);
      return { success: false, message: 'No devices found' };
    }

    // Initialiser APNs
    const provider = initializeAPNs();

    // Créer la notification
    const note = new apn.Notification();
    note.alert = {
      title,
      body
    };
    note.sound = 'default';
    note.badge = 1;
    note.payload = data;
    note.topic = process.env.APNS_BUNDLE_ID;

    // Envoyer aux devices
    const deviceTokens = devicesResult.rows.map(row => row.device_token);
    const result = await provider.send(note, deviceTokens);

    // Logger les résultats
    console.log('Push notification sent:', {
      sent: result.sent.length,
      failed: result.failed.length
    });

    // Enregistrer dans la DB
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'push', title, body, JSON.stringify(data)]
    );

    return {
      success: true,
      sent: result.sent.length,
      failed: result.failed.length
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoie un rappel quotidien pour les habitudes
 */
const sendDailyReminder = async (userId) => {
  // Récupérer les habitudes non complétées aujourd'hui
  const habitsResult = await query(
    `SELECT h.id, h.name
     FROM habits h
     WHERE h.user_id = $1
     AND h.archived = FALSE
     AND h.reminder_enabled = TRUE
     AND h.id NOT IN (
       SELECT habit_id FROM habit_checkins
       WHERE user_id = $1 AND checkin_date = CURRENT_DATE
     )`,
    [userId]
  );

  if (habitsResult.rows.length === 0) {
    return { success: false, message: 'No habits to remind' };
  }

  const habitCount = habitsResult.rows.length;
  const habitNames = habitsResult.rows.map(h => h.name).join(', ');

  const title = 'Daily Habit Reminder';
  const body = habitCount === 1
    ? `Don't forget to complete: ${habitNames}`
    : `You have ${habitCount} habits to complete today`;

  return await sendPushNotification(userId, {
    title,
    body,
    data: { type: 'daily_reminder', habit_count: habitCount }
  });
};

/**
 * Envoie une notification de nouveau badge
 */
const sendBadgeUnlockedNotification = async (userId, badge) => {
  const title = 'New Badge Unlocked!';
  const body = `Congratulations! You unlocked: ${badge.name}`;

  return await sendPushNotification(userId, {
    title,
    body,
    data: { type: 'badge_unlocked', badge_id: badge.id }
  });
};

/**
 * Envoie une notification de streak
 */
const sendStreakMilestoneNotification = async (userId, habitName, streak) => {
  const title = 'Streak Milestone!';
  const body = `You are on a ${streak} day streak for ${habitName}. Keep it up!`;

  return await sendPushNotification(userId, {
    title,
    body,
    data: { type: 'streak_milestone', streak }
  });
};

/**
 * Envoie une notification de goal complété
 */
const sendGoalCompletedNotification = async (userId, goalTitle) => {
  const title = 'Goal Completed!';
  const body = `Congratulations! You completed: ${goalTitle}`;

  return await sendPushNotification(userId, {
    title,
    body,
    data: { type: 'goal_completed' }
  });
};

/**
 * Envoie un résumé hebdomadaire
 */
const sendWeeklySummary = async (userId) => {
  // Récupérer les stats de la semaine
  const checkinsResult = await query(
    `SELECT COUNT(*) as count FROM habit_checkins
     WHERE user_id = $1
     AND checkin_date >= CURRENT_DATE - INTERVAL '7 days'`,
    [userId]
  );

  const checkinCount = parseInt(checkinsResult.rows[0].count);

  if (checkinCount === 0) {
    return { success: false, message: 'No activity this week' };
  }

  const title = 'Weekly Summary';
  const body = `Great week! You completed ${checkinCount} habit check-ins. Keep up the momentum!`;

  return await sendPushNotification(userId, {
    title,
    body,
    data: { type: 'weekly_summary', checkin_count: checkinCount }
  });
};

/**
 * Envoie un résumé mensuel
 */
const sendMonthlySummary = async (userId) => {
  // Récupérer les stats du mois
  const statsResult = await query(
    `SELECT
       COUNT(*) as checkins,
       (SELECT COUNT(*) FROM goals WHERE user_id = $1 AND completed = TRUE AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)) as goals_completed,
       (SELECT COUNT(*) FROM user_badges WHERE user_id = $1 AND unlocked_at >= DATE_TRUNC('month', CURRENT_DATE)) as badges_unlocked
     FROM habit_checkins
     WHERE user_id = $1
     AND checkin_date >= DATE_TRUNC('month', CURRENT_DATE)`,
    [userId]
  );

  const stats = statsResult.rows[0];
  const checkins = parseInt(stats.checkins);
  const goalsCompleted = parseInt(stats.goals_completed);
  const badgesUnlocked = parseInt(stats.badges_unlocked);

  if (checkins === 0 && goalsCompleted === 0 && badgesUnlocked === 0) {
    return { success: false, message: 'No activity this month' };
  }

  const title = 'Monthly Summary';
  const body = `Amazing month! ${checkins} check-ins, ${goalsCompleted} goals completed, ${badgesUnlocked} badges unlocked!`;

  return await sendPushNotification(userId, {
    title,
    body,
    data: { type: 'monthly_summary', stats }
  });
};

/**
 * Récupère les notifications d'un utilisateur
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 50, offset = 0, read = null } = options;

  let queryText = 'SELECT * FROM notifications WHERE user_id = $1';
  const params = [userId];
  let paramCount = 2;

  if (read !== null) {
    queryText += ` AND read = $${paramCount}`;
    params.push(read);
    paramCount++;
  }

  queryText += ' ORDER BY created_at DESC';

  if (limit) {
    queryText += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
  }

  if (offset) {
    queryText += ` OFFSET $${paramCount}`;
    params.push(offset);
  }

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Marque une notification comme lue
 */
const markNotificationAsRead = async (userId, notificationId) => {
  const result = await query(
    'UPDATE notifications SET read = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Notification not found');
  }

  return result.rows[0];
};

/**
 * Marque toutes les notifications comme lues
 */
const markAllNotificationsAsRead = async (userId) => {
  await query(
    'UPDATE notifications SET read = TRUE, updated_at = NOW() WHERE user_id = $1 AND read = FALSE',
    [userId]
  );
};

/**
 * Supprime une notification
 */
const deleteNotification = async (userId, notificationId) => {
  const result = await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Notification not found');
  }
};

/**
 * Récupère le nombre de notifications non lues
 */
const getUnreadCount = async (userId) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
    [userId]
  );

  return parseInt(result.rows[0].count);
};

/**
 * Envoie une notification test
 */
const sendTestNotification = async (userId) => {
  const title = 'Test Notification';
  const body = 'This is a test notification from Atomic';

  return await sendPushNotification(userId, {
    title,
    body,
    data: { type: 'test' }
  });
};

module.exports = {
  initializeAPNs,
  sendPushNotification,
  sendDailyReminder,
  sendBadgeUnlockedNotification,
  sendStreakMilestoneNotification,
  sendGoalCompletedNotification,
  sendWeeklySummary,
  sendMonthlySummary,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  sendTestNotification
};
