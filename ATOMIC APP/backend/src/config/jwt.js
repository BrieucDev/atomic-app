// ========================================
// JWT CONFIGURATION
// Token generation & verification
// ========================================

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

/**
 * Génère un access token JWT
 * @param {Object} payload - Données à inclure dans le token
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'atomic-api',
    audience: 'atomic-app'
  });
};

/**
 * Génère un refresh token
 * @param {String} userId - ID de l'utilisateur
 * @returns {String} Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
    jti: uuidv4() // JWT ID unique
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'atomic-api'
  });
};

/**
 * Vérifie un access token
 * @param {String} token - Token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'atomic-api',
      audience: 'atomic-app'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Vérifie un refresh token
 * @param {String} token - Token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'atomic-api'
    });
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Génère un token de vérification d'email
 * @returns {String} Token
 */
const generateEmailVerificationToken = () => {
  return uuidv4();
};

/**
 * Génère un token de reset password
 * @returns {String} Token
 */
const generatePasswordResetToken = () => {
  return uuidv4();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken
};
