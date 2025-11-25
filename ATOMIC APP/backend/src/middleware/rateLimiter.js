// ========================================
// RATE LIMITING MIDDLEWARE
// Protection contre brute force et spam
// ========================================

const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');

/**
 * Rate limiter général pour l'API
 * 100 requêtes par 15 minutes par IP
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter strict pour les tentatives de login
 * 5 tentatives par 15 minutes par IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  message: {
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes'
  },
  skipSuccessfulRequests: true, // Ne compte que les échecs
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour signup
 * 3 inscriptions par heure par IP
 */
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,
  message: {
    error: 'Too many accounts created',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour reset password
 * 3 demandes par heure par IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many password reset requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Enregistre une tentative de login dans la DB
 * @param {String} email - Email utilisé
 * @param {String} ipAddress - IP de l'utilisateur
 * @param {Boolean} success - Succès ou échec
 */
const logLoginAttempt = async (email, ipAddress, success) => {
  try {
    await query(
      'INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)',
      [email.toLowerCase(), ipAddress, success]
    );
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
};

/**
 * Vérifie si une IP est bloquée pour brute force
 * @param {String} email - Email visé
 * @param {String} ipAddress - IP à vérifier
 * @returns {Promise<Boolean>} true si bloqué
 */
const isBlocked = async (email, ipAddress) => {
  try {
    // Vérifier les tentatives des 15 dernières minutes
    const result = await query(
      `SELECT COUNT(*) as attempts
       FROM login_attempts
       WHERE email = $1
       AND ip_address = $2
       AND success = false
       AND attempted_at > NOW() - INTERVAL '15 minutes'`,
      [email.toLowerCase(), ipAddress]
    );

    const attempts = parseInt(result.rows[0].attempts);
    return attempts >= 5;
  } catch (error) {
    console.error('Error checking if blocked:', error);
    return false;
  }
};

module.exports = {
  apiLimiter,
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  logLoginAttempt,
  isBlocked
};
