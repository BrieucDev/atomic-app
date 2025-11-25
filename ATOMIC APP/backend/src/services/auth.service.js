// ========================================
// AUTHENTICATION SERVICE
// Logique métier pour l'authentification
// ========================================

const { query, transaction } = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyRefreshToken
} = require('../config/jwt');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
} = require('../utils/email');

/**
 * Inscription d'un nouvel utilisateur (email/password)
 */
const signup = async ({ email, password, name }) => {
  return await transaction(async (client) => {
    // Vérifier si l'email existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND is_deleted = FALSE',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, auth_provider)
       VALUES ($1, $2, $3, 'local')
       RETURNING id, email, name, created_at`,
      [email.toLowerCase(), passwordHash, name || 'User']
    );

    const user = userResult.rows[0];

    // Créer les settings par défaut
    await client.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );

    // Générer token de vérification d'email
    const verificationToken = generateEmailVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await client.query(
      'INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, verificationToken, expiresAt]
    );

    // Envoyer l'email de vérification
    await sendVerificationEmail(user.email, verificationToken, user.name);

    // Générer les tokens JWT
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken(user.id);

    // Stocker le refresh token
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours
    await client.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshExpiresAt]
    );

    // Log audit
    await client.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [user.id, 'account_created', JSON.stringify({ method: 'email' })]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  });
};

/**
 * Connexion utilisateur
 */
const login = async ({ email, password, ipAddress }) => {
  // Récupérer l'utilisateur
  const result = await query(
    `SELECT id, email, email_verified, password_hash, name, is_deleted
     FROM users
     WHERE email = $1 AND auth_provider = 'local'`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Vérifier si le compte est supprimé
  if (user.is_deleted) {
    throw new Error('Account has been deleted');
  }

  // Vérifier le mot de passe
  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Mettre à jour last_login_at
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Générer les tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken(user.id);

  // Stocker le refresh token
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info) VALUES ($1, $2, $3, $4)',
    [user.id, refreshToken, refreshExpiresAt, JSON.stringify({ ipAddress })]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.email_verified
    },
    tokens: {
      accessToken,
      refreshToken
    }
  };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  // Vérifier le refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Vérifier qu'il existe en DB et n'est pas révoqué
  const result = await query(
    `SELECT user_id, expires_at, revoked_at
     FROM refresh_tokens
     WHERE token = $1`,
    [refreshToken]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid refresh token');
  }

  const tokenData = result.rows[0];

  if (tokenData.revoked_at) {
    throw new Error('Refresh token has been revoked');
  }

  if (new Date() > new Date(tokenData.expires_at)) {
    throw new Error('Refresh token has expired');
  }

  // Générer un nouvel access token
  const userResult = await query(
    'SELECT id, email FROM users WHERE id = $1 AND is_deleted = FALSE',
    [tokenData.user_id]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });

  return { accessToken };
};

/**
 * Logout (révoque le refresh token)
 */
const logout = async (refreshToken) => {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
    [refreshToken]
  );
};

/**
 * Vérification d'email
 */
const verifyEmail = async (token) => {
  const result = await query(
    `SELECT user_id, expires_at, verified_at
     FROM email_verifications
     WHERE token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid verification token');
  }

  const verification = result.rows[0];

  if (verification.verified_at) {
    throw new Error('Email already verified');
  }

  if (new Date() > new Date(verification.expires_at)) {
    throw new Error('Verification token has expired');
  }

  // Marquer l'email comme vérifié
  await transaction(async (client) => {
    await client.query(
      'UPDATE users SET email_verified = TRUE WHERE id = $1',
      [verification.user_id]
    );

    await client.query(
      'UPDATE email_verifications SET verified_at = NOW() WHERE token = $1',
      [token]
    );

    // Envoyer email de bienvenue
    const userResult = await client.query(
      'SELECT email, name FROM users WHERE id = $1',
      [verification.user_id]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      await sendWelcomeEmail(user.email, user.name);
    }
  });
};

/**
 * Demande de reset password
 */
const forgotPassword = async (email) => {
  const result = await query(
    'SELECT id, name FROM users WHERE email = $1 AND is_deleted = FALSE',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    // Ne pas révéler si l'email existe ou non
    return;
  }

  const user = result.rows[0];

  // Générer token
  const resetToken = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, resetToken, expiresAt]
  );

  // Envoyer l'email
  await sendPasswordResetEmail(email, resetToken, user.name);
};

/**
 * Reset password avec token
 */
const resetPassword = async (token, newPassword) => {
  const result = await query(
    `SELECT user_id, expires_at, used_at
     FROM password_resets
     WHERE token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid reset token');
  }

  const reset = result.rows[0];

  if (reset.used_at) {
    throw new Error('Reset token already used');
  }

  if (new Date() > new Date(reset.expires_at)) {
    throw new Error('Reset token has expired');
  }

  // Hasher le nouveau mot de passe
  const passwordHash = await hashPassword(newPassword);

  await transaction(async (client) => {
    // Mettre à jour le mot de passe
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, reset.user_id]
    );

    // Marquer le token comme utilisé
    await client.query(
      'UPDATE password_resets SET used_at = NOW() WHERE token = $1',
      [token]
    );

    // Révoquer tous les refresh tokens existants
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [reset.user_id]
    );

    // Log audit
    await client.query(
      'INSERT INTO audit_logs (user_id, action) VALUES ($1, $2)',
      [reset.user_id, 'password_reset']
    );
  });
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword
};
