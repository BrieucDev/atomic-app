// ========================================
// AUTHENTICATION MIDDLEWARE
// Vérifie le JWT token dans les requêtes
// ========================================

const { verifyAccessToken } = require('../config/jwt');
const { query } = require('../config/database');

/**
 * Middleware d'authentification
 * Vérifie le token JWT et charge l'utilisateur
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token
    const decoded = verifyAccessToken(token);

    // Charger l'utilisateur depuis la DB
    const result = await query(
      'SELECT id, email, email_verified, name, is_deleted FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Vérifier que le compte n'est pas supprimé
    if (user.is_deleted) {
      return res.status(401).json({
        error: 'Account deleted',
        message: 'This account has been deleted'
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si pas de token, mais charge l'user si présent
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      const result = await query(
        'SELECT id, email, email_verified, name, is_deleted FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0 && !result.rows[0].is_deleted) {
        req.user = result.rows[0];
        req.userId = result.rows[0].id;
      }
    }

    next();
  } catch (error) {
    // Ignorer les erreurs, l'auth est optionnelle
    next();
  }
};

/**
 * Middleware pour vérifier que l'email est vérifié
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Email not verified',
      message: 'Please verify your email address before accessing this resource'
    });
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireEmailVerified
};
