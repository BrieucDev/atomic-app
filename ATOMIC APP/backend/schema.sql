-- ========================================
-- ATOMIC APP - DATABASE SCHEMA
-- Champ Corp - Backend Architecture
-- ========================================

-- Extensions PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- TABLE: users
-- Gestion des comptes utilisateurs
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash TEXT, -- NULL si auth sociale uniquement
    auth_provider VARCHAR(20) DEFAULT 'local', -- 'local', 'apple', 'google'
    provider_id VARCHAR(255), -- ID externe du provider (Apple/Google)

    -- Profil
    name VARCHAR(100) DEFAULT 'User',
    bio TEXT DEFAULT 'Building better habits, one day at a time',
    profile_picture_url TEXT,

    -- Onboarding
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP,

    -- Compte invité (pour conversion ultérieure)
    is_guest BOOLEAN DEFAULT FALSE,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,

    -- Index pour performance
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_provider ON users(auth_provider, provider_id);
CREATE INDEX idx_users_guest ON users(is_guest) WHERE is_guest = TRUE;

-- ========================================
-- TABLE: user_settings
-- Préférences utilisateur (thème, notifications, etc.)
-- ========================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Thème
    theme_preference VARCHAR(10) DEFAULT 'system', -- 'light', 'dark', 'system'

    -- Notifications - Globales
    notifications_enabled BOOLEAN DEFAULT TRUE,

    -- Notifications - Détail
    daily_reminder_enabled BOOLEAN DEFAULT TRUE,
    daily_reminder_time TIME DEFAULT '20:00:00',

    weekly_summary_enabled BOOLEAN DEFAULT TRUE,
    weekly_summary_day INTEGER DEFAULT 0, -- 0 = Dimanche
    weekly_summary_time TIME DEFAULT '19:00:00',

    monthly_summary_enabled BOOLEAN DEFAULT TRUE,
    monthly_summary_day INTEGER DEFAULT 1, -- Premier jour du mois
    monthly_summary_time TIME DEFAULT '19:00:00',

    badges_notification_enabled BOOLEAN DEFAULT TRUE,

    -- Timezone pour notifications
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Analytics
    analytics_enabled BOOLEAN DEFAULT TRUE,

    -- Langue
    language VARCHAR(5) DEFAULT 'en',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);

-- ========================================
-- TABLE: email_verifications
-- Tokens de vérification d'email
-- ========================================
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token) WHERE verified_at IS NULL;
CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);

-- ========================================
-- TABLE: password_resets
-- Tokens de réinitialisation de mot de passe
-- ========================================
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_resets_token ON password_resets(token) WHERE used_at IS NULL;
CREATE INDEX idx_password_resets_user ON password_resets(user_id);

-- ========================================
-- TABLE: refresh_tokens
-- Gestion des tokens de refresh pour JWT
-- ========================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    device_info JSONB, -- User-Agent, platform, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE revoked_at IS NULL;

-- ========================================
-- TABLE: devices
-- Appareils pour push notifications
-- ========================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(10) NOT NULL, -- 'ios', 'android'
    push_token TEXT NOT NULL,
    device_name VARCHAR(100),
    os_version VARCHAR(20),
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, push_token)
);

CREATE INDEX idx_devices_user ON devices(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_devices_push_token ON devices(push_token) WHERE is_active = TRUE;

-- ========================================
-- TABLE: habits
-- Habitudes créées par les utilisateurs
-- ========================================
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(10) NOT NULL, -- 'daily', 'weekly', 'monthly'
    category VARCHAR(20) NOT NULL, -- 'health', 'productivity', etc.

    color VARCHAR(7) NOT NULL, -- Hex color
    icon_name VARCHAR(50) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_type CHECK (type IN ('daily', 'weekly', 'monthly')),
    CONSTRAINT valid_category CHECK (category IN ('health', 'productivity', 'studies', 'finance', 'personal', 'fitness', 'mindfulness', 'social', 'other'))
);

CREATE INDEX idx_habits_user ON habits(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_habits_type ON habits(type);
CREATE INDEX idx_habits_created ON habits(created_at DESC);

-- ========================================
-- TABLE: habit_checkins
-- Check-ins quotidiens des habitudes
-- ========================================
CREATE TABLE habit_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    date DATE NOT NULL, -- Format YYYY-MM-DD
    atomic_points DECIMAL(4,2) DEFAULT 0.1,

    notes TEXT, -- Notes optionnelles

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(habit_id, date) -- Un seul check-in par habit par jour
);

CREATE INDEX idx_checkins_habit ON habit_checkins(habit_id);
CREATE INDEX idx_checkins_user ON habit_checkins(user_id);
CREATE INDEX idx_checkins_date ON habit_checkins(date DESC);
CREATE INDEX idx_checkins_user_date ON habit_checkins(user_id, date DESC);

-- ========================================
-- TABLE: goals
-- Objectifs créés par les utilisateurs
-- ========================================
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    description TEXT,

    goal_type VARCHAR(20) NOT NULL, -- 'habit_based', 'action_based'
    period VARCHAR(10) NOT NULL, -- 'weekly', 'monthly'

    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_goal_type CHECK (goal_type IN ('habit_based', 'action_based')),
    CONSTRAINT valid_period CHECK (period IN ('weekly', 'monthly')),
    CONSTRAINT valid_target CHECK (target_value > 0)
);

CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_period ON goals(period, end_date);
CREATE INDEX idx_goals_completed ON goals(is_completed, user_id);

-- ========================================
-- TABLE: goal_habits
-- Relation Many-to-Many entre Goals et Habits
-- ========================================
CREATE TABLE goal_habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(goal_id, habit_id)
);

CREATE INDEX idx_goal_habits_goal ON goal_habits(goal_id);
CREATE INDEX idx_goal_habits_habit ON goal_habits(habit_id);

-- ========================================
-- TABLE: badge_templates
-- Templates de badges (définis côté serveur)
-- ========================================
CREATE TABLE badge_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL,

    condition_type VARCHAR(30) NOT NULL, -- 'first_step', 'streak', 'total_points', 'goals_completed', 'habits_created'
    condition_value INTEGER NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_condition_type CHECK (condition_type IN ('first_step', 'streak', 'total_points', 'goals_completed', 'habits_created'))
);

CREATE INDEX idx_badge_templates_active ON badge_templates(is_active, sort_order);

-- ========================================
-- TABLE: user_badges
-- Badges obtenus par les utilisateurs
-- ========================================
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_template_id UUID NOT NULL REFERENCES badge_templates(id) ON DELETE CASCADE,

    obtained_at TIMESTAMP DEFAULT NOW(),
    notified_at TIMESTAMP, -- Quand la notif a été envoyée

    UNIQUE(user_id, badge_template_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_obtained ON user_badges(obtained_at DESC);

-- ========================================
-- TABLE: login_attempts
-- Tracking des tentatives de connexion (rate limiting)
-- ========================================
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempted_at DESC);

-- ========================================
-- TABLE: audit_logs
-- Logs d'actions importantes (RGPD, sécurité)
-- ========================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'account_created', 'data_exported', 'account_deleted', etc.
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ========================================
-- TABLE: notification_queue
-- Queue pour envoi différé de notifications
-- ========================================
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,

    notification_type VARCHAR(30) NOT NULL, -- 'daily_reminder', 'weekly_summary', 'monthly_summary', 'badge_earned'
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB, -- Données additionnelles pour deep linking

    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE sent_at IS NULL AND failed_at IS NULL;
CREATE INDEX idx_notification_queue_user ON notification_queue(user_id);

-- ========================================
-- TABLE: app_config
-- Configuration globale de l'app (URLs, versions, etc.)
-- ========================================
CREATE TABLE app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertion des configs par défaut
INSERT INTO app_config (key, value, description) VALUES
('privacy_policy_url', 'https://champcorp.com/atomic/privacy', 'URL de la politique de confidentialité'),
('terms_of_service_url', 'https://champcorp.com/atomic/terms', 'URL des CGU'),
('support_email', 'support@champcorp.com', 'Email de support'),
('company_name', 'Champ Corp', 'Nom de la société éditrice'),
('min_app_version_ios', '1.0.0', 'Version minimale requise iOS'),
('maintenance_mode', 'false', 'Mode maintenance activé'),
('api_version', 'v1', 'Version actuelle de l''API');

-- ========================================
-- FONCTIONS UTILITAIRES
-- ========================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vue pour statistiques utilisateur (performance)
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id as user_id,
    u.email,
    u.name,
    COUNT(DISTINCT h.id) as total_habits,
    COUNT(DISTINCT hc.id) as total_checkins,
    COALESCE(SUM(hc.atomic_points), 0) as total_points,
    COUNT(DISTINCT g.id) FILTER (WHERE g.is_completed = TRUE) as completed_goals,
    COUNT(DISTINCT ub.id) as badges_earned
FROM users u
LEFT JOIN habits h ON h.user_id = u.id AND h.is_active = TRUE
LEFT JOIN habit_checkins hc ON hc.user_id = u.id
LEFT JOIN goals g ON g.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.is_deleted = FALSE
GROUP BY u.id, u.email, u.name;

-- ========================================
-- SEED DATA: Badge Templates par défaut
-- ========================================
INSERT INTO badge_templates (name, description, icon_name, condition_type, condition_value, sort_order) VALUES
('First Step', 'Complete your very first habit', 'footsteps', 'first_step', 1, 1),
('Consistency 7', 'Maintain a 7-day streak', 'flame', 'streak', 7, 2),
('Consistency 30', 'Maintain a 30-day streak', 'trophy', 'streak', 30, 3),
('Consistency 100', 'Maintain a 100-day streak', 'star', 'streak', 100, 4),
('Atomic 100', 'Reach 100 ATOMIC points', 'planet', 'total_points', 100, 5),
('Atomic 500', 'Reach 500 ATOMIC points', 'rocket', 'total_points', 500, 6),
('Goal Crusher', 'Complete 5 goals', 'flag', 'goals_completed', 5, 7),
('Goal Master', 'Complete 20 goals', 'medal', 'goals_completed', 20, 8),
('Habit Builder', 'Create 10 habits', 'construct', 'habits_created', 10, 9);

-- ========================================
-- COMMENTAIRES POUR MAINTENANCE
-- ========================================

COMMENT ON TABLE users IS 'Comptes utilisateurs avec support auth locale et sociale (Apple/Google)';
COMMENT ON TABLE user_settings IS 'Préférences utilisateur: thème, notifications, langue';
COMMENT ON TABLE habit_checkins IS 'Check-ins quotidiens: 1 check-in = 0.1 points ATOMIC';
COMMENT ON TABLE badge_templates IS 'Templates de badges: modifier condition_value pour ajuster les seuils';
COMMENT ON TABLE app_config IS 'Configuration globale: URLs légales, emails, versions';
COMMENT ON COLUMN users.is_guest IS 'TRUE = compte invité local, peut être converti en compte réel';
COMMENT ON COLUMN user_settings.daily_reminder_time IS 'Heure locale pour rappel quotidien (20:00 par défaut)';
COMMENT ON COLUMN notification_queue.scheduled_for IS 'Timestamp UTC pour envoi planifié';
