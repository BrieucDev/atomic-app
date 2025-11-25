// ========================================
// VALIDATION MIDDLEWARE
// Validation des inputs avec express-validator
// ========================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware pour vérifier les erreurs de validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }
  next();
};

// ========================================
// RÈGLES DE VALIDATION AUTH
// ========================================

const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  validate
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  validate
];

const resetPasswordValidation = [
  body('token')
    .isUUID()
    .withMessage('Valid token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validate
];

// ========================================
// RÈGLES DE VALIDATION USER
// ========================================

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be max 500 characters'),
  validate
];

// ========================================
// RÈGLES DE VALIDATION HABITS
// ========================================

const createHabitValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required (max 200 characters)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description max 1000 characters'),
  body('type')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Type must be daily, weekly, or monthly'),
  body('category')
    .isIn(['health', 'productivity', 'studies', 'finance', 'personal', 'fitness', 'mindfulness', 'social', 'other'])
    .withMessage('Invalid category'),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('iconName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon name is required'),
  validate
];

const updateHabitValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid habit ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body('type')
    .optional()
    .isIn(['daily', 'weekly', 'monthly']),
  body('category')
    .optional()
    .isIn(['health', 'productivity', 'studies', 'finance', 'personal', 'fitness', 'mindfulness', 'social', 'other']),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i),
  body('iconName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }),
  validate
];

// ========================================
// RÈGLES DE VALIDATION GOALS
// ========================================

const createGoalValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required'),
  body('goalType')
    .isIn(['habit_based', 'action_based'])
    .withMessage('Goal type must be habit_based or action_based'),
  body('period')
    .isIn(['weekly', 'monthly'])
    .withMessage('Period must be weekly or monthly'),
  body('targetValue')
    .isInt({ min: 1 })
    .withMessage('Target value must be a positive integer'),
  body('linkedHabitIds')
    .optional()
    .isArray()
    .withMessage('Linked habits must be an array'),
  validate
];

// ========================================
// RÈGLES DE VALIDATION SETTINGS
// ========================================

const updateSettingsValidation = [
  body('themePreference')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Valid timezone required'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Valid language code required'),
  validate
];

module.exports = {
  validate,
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  createHabitValidation,
  updateHabitValidation,
  createGoalValidation,
  updateSettingsValidation
};
