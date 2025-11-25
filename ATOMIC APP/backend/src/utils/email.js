// ========================================
// EMAIL UTILITIES
// Service d'envoi d'emails via SendGrid/Nodemailer
// ========================================

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Configuration du transporteur email
let transporter;

if (process.env.EMAIL_PROVIDER === 'sendgrid') {
  // SendGrid
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
} else {
  // Configuration SMTP générique
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Charge et compile un template email
 * @param {String} templateName - Nom du fichier template
 * @param {Object} data - Données pour le template
 * @returns {Promise<String>} HTML compilé
 */
const compileTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(process.cwd(), 'backend/src/templates/emails', `${templateName}.hbs`);
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    console.error('Error compiling email template:', error);
    throw error;
  }
};

/**
 * Envoie un email
 * @param {Object} options - Options d'envoi
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'ATOMIC'} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML pour version texte
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Envoie un email de vérification
 * @param {String} email - Email du destinataire
 * @param {String} token - Token de vérification
 * @param {String} name - Nom de l'utilisateur
 */
const sendVerificationEmail = async (email, token, name) => {
  const verificationUrl = `${process.env.EMAIL_VERIFICATION_URL}?token=${token}`;

  const html = await compileTemplate('email-verification', {
    name,
    verificationUrl,
    companyName: process.env.COMPANY_NAME
  });

  await sendEmail({
    to: email,
    subject: 'Verify your ATOMIC account',
    html
  });
};

/**
 * Envoie un email de reset password
 * @param {String} email - Email du destinataire
 * @param {String} token - Token de reset
 * @param {String} name - Nom de l'utilisateur
 */
const sendPasswordResetEmail = async (email, token, name) => {
  const resetUrl = `${process.env.PASSWORD_RESET_URL}?token=${token}`;

  const html = await compileTemplate('password-reset', {
    name,
    resetUrl,
    companyName: process.env.COMPANY_NAME
  });

  await sendEmail({
    to: email,
    subject: 'Reset your ATOMIC password',
    html
  });
};

/**
 * Envoie un email de bienvenue
 * @param {String} email - Email du destinataire
 * @param {String} name - Nom de l'utilisateur
 */
const sendWelcomeEmail = async (email, name) => {
  const html = await compileTemplate('welcome', {
    name,
    appUrl: process.env.FRONTEND_URL,
    companyName: process.env.COMPANY_NAME
  });

  await sendEmail({
    to: email,
    subject: 'Welcome to ATOMIC! 🔵',
    html
  });
};

/**
 * Envoie un email de confirmation de suppression de compte
 * @param {String} email - Email du destinataire
 * @param {String} name - Nom de l'utilisateur
 */
const sendAccountDeletionEmail = async (email, name) => {
  const html = await compileTemplate('account-deleted', {
    name,
    supportEmail: process.env.COMPANY_EMAIL,
    companyName: process.env.COMPANY_NAME
  });

  await sendEmail({
    to: email,
    subject: 'Your ATOMIC account has been deleted',
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountDeletionEmail
};
