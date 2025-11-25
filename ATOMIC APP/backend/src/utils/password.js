// ========================================
// PASSWORD UTILITIES
// Hashing & verification avec bcrypt
// ========================================

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12; // Nombre de rounds pour bcrypt

/**
 * Hash un mot de passe
 * @param {String} password - Mot de passe en clair
 * @returns {Promise<String>} Mot de passe hashé
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Vérifie un mot de passe
 * @param {String} password - Mot de passe en clair
 * @param {String} hash - Hash à comparer
 * @returns {Promise<Boolean>} true si match
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Valide la force d'un mot de passe
 * @param {String} password - Mot de passe à valider
 * @returns {Object} { valid: Boolean, errors: Array }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Optionnel: caractères spéciaux
  // if (!/[!@#$%^&*]/.test(password)) {
  //   errors.push('Password must contain at least one special character');
  // }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength
};
