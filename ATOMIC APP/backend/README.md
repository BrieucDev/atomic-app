# ATOMIC Backend API
**Champ Corp** - Backend Architecture

## 📋 Vue d'ensemble

Backend complet pour l'app ATOMIC incluant:
- ✅ Authentification (email/password + Apple/Google Sign-In)
- ✅ Gestion complète des comptes utilisateurs
- ✅ Système de notifications push planifiées
- ✅ Onboarding et mode invité
- ✅ Export de données (RGPD)
- ✅ Suppression de compte
- ✅ Rate limiting anti-brute force
- ✅ Conformité App Store & RGPD

## 🏗️ Architecture

```
backend/
├── schema.sql              # Schéma de base de données PostgreSQL
├── src/
│   ├── config/            # Configuration (DB, JWT, Push, etc.)
│   ├── models/            # Modèles de données
│   ├── services/          # Logique métier
│   ├── controllers/       # Endpoints API
│   ├── middleware/        # Auth, rate limiting, etc.
│   ├── jobs/              # Cron jobs (notifications, badges)
│   ├── utils/             # Helpers (email, hash, etc.)
│   └── routes/            # Définition des routes
├── .env.example           # Variables d'environnement
└── package.json           # Dépendances Node.js
```

## 🔐 Sécurité

- **Passwords**: Hashés avec bcrypt (12 rounds)
- **JWT**: Access tokens (15 min) + Refresh tokens (30 jours)
- **Rate Limiting**:
  - Login: 5 tentatives / 15 min par IP
  - API: 100 requêtes / 15 min par user
- **HTTPS**: Obligatoire en production
- **CORS**: Configuré pour domaines autorisés uniquement

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/signup` | Inscription email/password |
| POST | `/login` | Connexion |
| POST | `/logout` | Déconnexion |
| POST | `/refresh` | Refresh access token |
| POST | `/forgot-password` | Demande reset password |
| POST | `/reset-password` | Reset password avec token |
| POST | `/verify-email` | Vérification email avec token |
| POST | `/resend-verification` | Renvoyer email de vérification |
| POST | `/social/apple` | Sign-In avec Apple |
| POST | `/social/google` | Sign-In avec Google |
| POST | `/convert-guest` | Convertir compte invité en réel |

### User Profile (`/api/v1/me`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Récupérer profil complet |
| PATCH | `/` | Modifier profil (name, bio) |
| POST | `/avatar` | Upload photo de profil |
| DELETE | `/avatar` | Supprimer photo de profil |
| GET | `/stats` | Statistiques utilisateur |
| GET | `/export` | Export données (RGPD) |
| POST | `/delete` | Supprimer compte |

### Settings (`/api/v1/settings`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Récupérer tous les réglages |
| PATCH | `/theme` | Modifier thème (light/dark/system) |
| PATCH | `/notifications` | Modifier préférences notifications |
| PATCH | `/language` | Modifier langue |
| PATCH | `/timezone` | Modifier timezone |

### Habits (`/api/v1/habits`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des habits actifs |
| POST | `/` | Créer un habit |
| GET | `/:id` | Détails d'un habit |
| PATCH | `/:id` | Modifier un habit |
| DELETE | `/:id` | Supprimer (archiver) un habit |
| POST | `/:id/checkin` | Check-in pour un habit |
| DELETE | `/:id/checkin/:date` | Annuler un check-in |
| GET | `/:id/stats` | Stats & streak d'un habit |

### Goals (`/api/v1/goals`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des goals |
| POST | `/` | Créer un goal |
| GET | `/:id` | Détails d'un goal |
| PATCH | `/:id` | Modifier un goal |
| DELETE | `/:id` | Supprimer un goal |
| POST | `/:id/increment` | +1 sur action-based goal |

### Badges (`/api/v1/badges`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste badges obtenus + locked |
| GET | `/:id` | Détails d'un badge |

### Devices (`/api/v1/devices`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Enregistrer device pour push |
| DELETE | `/:id` | Retirer un device |
| GET | `/` | Liste des devices |

### Config (`/api/v1/config`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Configuration publique de l'app |
| GET | `/legal` | URLs CGU, Privacy, Support |

## 🔔 Système de Notifications

### Types de notifications

1. **Rappel quotidien** (Daily Reminder)
   - Envoyé à l'heure configurée par l'utilisateur
   - Titre: "Don't break the chain! 🔥"
   - Body: "You haven't completed your habits today"
   - Condition: Aucun check-in fait aujourd'hui

2. **Récap hebdomadaire** (Weekly Summary)
   - Envoyé le dimanche soir par défaut
   - Résumé: habits complétés, points gagnés, streaks

3. **Récap mensuel** (Monthly Summary)
   - Envoyé le 1er du mois
   - Vue synthétique du mois écoulé

4. **Badge obtenu** (Badge Earned)
   - Envoyé immédiatement à l'obtention
   - Titre: "🏆 New Badge Unlocked!"
   - Body: Nom et description du badge

### Cron Jobs

- **Vérification badges**: Toutes les heures
- **Rappels quotidiens**: Toutes les 30 minutes (vérifie heure locale)
- **Récaps hebdo**: Le dimanche à 19h
- **Récaps mensuels**: Le 1er du mois à 19h
- **Nettoyage**: Suppression anciens tokens (quotidien)

## 🌍 RGPD & Conformité

### Export de données (`GET /api/v1/me/export`)

Format JSON contenant:
```json
{
  "user": { /* profil complet */ },
  "settings": { /* préférences */ },
  "habits": [ /* liste habits */ ],
  "checkins": [ /* tous les check-ins */ ],
  "goals": [ /* liste goals */ ],
  "badges": [ /* badges obtenus */ ],
  "exported_at": "2025-01-XX..."
}
```

### Suppression de compte (`POST /api/v1/me/delete`)

Deux stratégies possibles:

**Option 1: Suppression physique** (recommandé)
- Suppression en cascade de toutes les données
- Anonymisation des audit_logs associés

**Option 2: Soft delete**
- Marque `is_deleted = true`
- Anonymise email: `deleted_user_[UUID]@deleted.local`
- Conserve pour stats agrégées anonymes

Implémentation actuelle: **Suppression physique** (conformité RGPD stricte)

### Données collectées (App Store Privacy)

À déclarer dans App Store Connect:

**Identifiants**:
- Email (lié à l'identité)
- Nom (lié à l'identité)

**Utilisation**:
- Authentification
- Fonctionnalités de l'app (habits, goals)

**Historique d'utilisation**:
- Interactions avec l'app (check-ins, stats)
- Finalité: Analytics produit

**Contenu utilisateur**:
- Habits créés, check-ins, goals
- Finalité: Fonctionnalités de l'app

Aucune donnée vendue à des tiers ✅

## 🚀 Déploiement

### Variables d'environnement

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/atomic_db

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Email (SendGrid, Mailgun, etc.)
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@champcorp.com
EMAIL_API_KEY=your-email-api-key

# Push Notifications (APNs pour iOS)
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-team-id
APNS_KEY_PATH=./certs/AuthKey_XXXXX.p8
APNS_PRODUCTION=false

# Apple Sign-In
APPLE_CLIENT_ID=com.champcorp.atomic
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY_PATH=./certs/AuthKey_XXXXX.p8

# Google Sign-In
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Storage (S3, Cloudinary, etc.)
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=atomic-profile-pictures
AWS_REGION=us-east-1

# App Config
API_URL=https://api.atomic.champcorp.com
FRONTEND_URL=https://atomic.champcorp.com
SUPPORT_EMAIL=support@champcorp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Environment
NODE_ENV=production
PORT=3000
```

### Environnements

**Staging** (`staging.api.atomic.champcorp.com`)
- Base de données de test
- Push notifications en mode sandbox
- Logs verbeux

**Production** (`api.atomic.champcorp.com`)
- Base de données production
- Push notifications production
- Monitoring actif

## 📊 Monitoring & Analytics

### Métriques trackées

Backend:
- Nombre d'inscriptions / jour
- Utilisateurs actifs quotidiens (DAU)
- Utilisateurs actifs mensuels (MAU)
- Taux de rétention D+1, D+7, D+30
- Temps de réponse API
- Taux d'erreur

App (anonymisé):
- Événements: `habit_created`, `checkin_completed`, `goal_achieved`, `badge_earned`
- Pas de tracking d'informations personnelles

### Crash Reporting

Intégration recommandée: Sentry

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Supprimer infos sensibles
    delete event.request?.cookies;
    return event;
  }
});
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Coverage
npm run test:coverage
```

Couverture minimale: 80%

## 📝 Pages Légales

### CGU (Terms of Service)
URL: `https://champcorp.com/atomic/terms`

Contenu requis:
- Description du service
- Conditions d'utilisation
- Propriété intellectuelle
- Responsabilité limitée
- Droit applicable

### Politique de Confidentialité (Privacy Policy)
URL: `https://champcorp.com/atomic/privacy`

Contenu requis (RGPD):
- Données collectées
- Finalités de traitement
- Base légale (consentement, intérêt légitime)
- Durée de conservation
- Droits de l'utilisateur:
  - Accès (export)
  - Rectification (édition profil)
  - Suppression (delete account)
  - Portabilité (export JSON)
- Transferts de données (si hors UE)
- Cookies & tracking
- Contact DPO: privacy@champcorp.com

### Mentions Légales
Accessible depuis l'app:
- Éditeur: **Champ Corp**
- Email: support@champcorp.com
- Hébergeur: [À compléter selon hébergement réel]

## 🔧 Maintenance

### Mise à jour des badges

Modifier `backend/schema.sql` section `badge_templates`:

```sql
INSERT INTO badge_templates (name, description, icon_name, condition_type, condition_value)
VALUES ('New Badge', 'Description', 'icon-name', 'streak', 50);
```

### Modification des points ATOMIC

Par défaut: **0.1 point** par check-in

Pour changer:
1. Modifier `habit_checkins.atomic_points` DEFAULT
2. Ou logique dans `services/habits.service.js`:

```javascript
const ATOMIC_POINTS_PER_CHECKIN = 0.1; // Modifier ici
```

### Mise à jour des horaires de notification

Modifier dans `user_settings`:
- `daily_reminder_time` (default: 20:00)
- `weekly_summary_time` (default: 19:00)
- `monthly_summary_time` (default: 19:00)

## 🎯 Checklist Pre-Production

### Backend
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] Certificats APNs installés
- [ ] Rate limiting activé
- [ ] HTTPS configuré
- [ ] CORS configuré
- [ ] Monitoring activé (Sentry, DataDog, etc.)
- [ ] Backups automatisés
- [ ] Logs centralisés

### App Store
- [ ] CGU accessibles dans l'app
- [ ] Privacy Policy accessible dans l'app
- [ ] Suppression de compte fonctionnelle
- [ ] Export de données fonctionnel
- [ ] Permissions notifications contextualisées
- [ ] App Privacy Details rempli
- [ ] Screenshots + description
- [ ] Contact email support valide

### Sécurité
- [ ] Scan de vulnérabilités (npm audit)
- [ ] Tests de pénétration basiques
- [ ] Rate limiting testé
- [ ] Token expiration testée
- [ ] Validation inputs testée

## 📞 Support

Email: support@champcorp.com

Temps de réponse: < 24h (jours ouvrés)
