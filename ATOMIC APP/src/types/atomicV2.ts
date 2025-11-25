// ========================================
// ATOMIC APP V2 - EXTENDED DATA MODELS & TYPES
// Aligned with "Atomic Habits" by James Clear
// ========================================

// ========================================
// V1 MODELS (EXTENDED)
// ========================================

// User Profile (Extended for V2)
export interface User {
  id: string;
  name: string;
  bio: string;
  profilePictureUrl: string | null;
  createdAt: string; // ISO date string

  // V2 Extensions
  atomicScore?: number; // Cached global score
  bestStreakAllTime?: number;
  premiumEnabled?: boolean; // Feature flag for premium
  featureFlags?: Record<string, boolean>; // Flexible feature toggles
}

// Habit Type (Daily, Weekly, Monthly)
export type HabitType = "daily" | "weekly" | "monthly";

// Habit Difficulty (V2)
export type HabitDifficulty = "easy" | "medium" | "hard";

// Habit Categories
export type HabitCategory =
  | "health"
  | "productivity"
  | "studies"
  | "finance"
  | "personal"
  | "fitness"
  | "mindfulness"
  | "social"
  | "other";

// Habit (Extended for V2)
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: HabitType;
  category: HabitCategory;
  color: string;
  iconName: string;
  isActive: boolean;
  createdAt: string;

  // V2 Extensions - Atomic Habits Alignment
  difficulty?: HabitDifficulty; // Easy = 0.1pts, Medium = 0.15pts, Hard = 0.2pts
  linkedIdentityIds?: string[]; // Identities this habit reinforces
  systemId?: string; // System this habit belongs to
  environmentTips?: string; // Tips to prepare environment (anti-friction)
  enableHabitStacking?: boolean; // Is this habit part of a stack?
  stackedAfterHabitId?: string; // If stacked, which habit comes before?
  cues?: Cue[]; // Triggers for this habit
}

// Habit Check-in (Extended for V2)
export interface HabitCheckin {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  atomicPoints: number; // Varies by difficulty: easy=0.1, medium=0.15, hard=0.2
  createdAt: string;

  // V2 Extensions
  note?: string; // Optional reflection note
  mood?: number; // 1-5 scale
}

// Goal Type
export type GoalType = "habit_based" | "action_based";

// Goal Period
export type GoalPeriod = "weekly" | "monthly";

// Goal (Extended for V2)
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  period: GoalPeriod;
  targetValue: number;
  currentValue: number;
  linkedHabitIds: string[];
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  createdAt: string;

  // V2 Extensions
  linkedIdentityId?: string; // Goal reinforces an identity
  systemId?: string; // Goal is part of a system
}

// Badge Condition Types (Extended for V2)
export type BadgeConditionType =
  | "streak"
  | "total_points"
  | "goals_completed"
  | "habits_created"
  | "first_step"
  | "identity_milestone" // V2: reinforce identity N times
  | "system_mastery" // V2: complete system at 80%+ for N days
  | "challenge_completed"; // V2: complete a challenge

// Badge (Achievements)
export interface Badge {
  id: string;
  userId: string;
  name: string;
  description: string;
  iconName: string;
  conditionType: BadgeConditionType;
  conditionValue: number;
  obtainedAt: string | null;
  createdAt: string;
}

// ========================================
// V2 NEW MODELS - ATOMIC HABITS FEATURES
// ========================================

// Identity (Identity-based habits)
// "Every action you take is a vote for the type of person you wish to become"
export interface Identity {
  id: string;
  userId: string;
  name: string; // e.g., "Athlete", "Writer", "Entrepreneur"
  description?: string;
  color: string; // Hex color for visual identity
  iconName: string; // Icon representing this identity
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// System (Groups of coherent habits)
// "You do not rise to the level of your goals. You fall to the level of your systems."
export interface System {
  id: string;
  userId: string;
  name: string; // e.g., "Health", "Business", "Mindset"
  description?: string;
  color: string;
  iconName: string;
  habitIds: string[]; // Habits in this system
  targetCompletionRate?: number; // 0-100, target % of habits to complete daily
  createdAt: string;
  updatedAt?: string;
}

// Cue (Triggers for habits)
// "Make it Obvious" - The 1st Law of Behavior Change
export type CueType = "time" | "location" | "context" | "after_habit" | "custom";

export interface Cue {
  id: string;
  habitId: string;
  userId: string;
  type: CueType;
  timeOfDay?: string; // HH:MM format, used if type="time"
  location?: string; // e.g., "Home", "Gym", used if type="location"
  contextDescription?: string; // e.g., "When I wake up", "After lunch"
  afterHabitId?: string; // Used if type="after_habit" (habit stacking)
  enabled: boolean;
  createdAt: string;
}

// Habit Stacking
// "After I [CURRENT HABIT], I will [NEW HABIT]"
export interface HabitStack {
  id: string;
  userId: string;
  baseHabitId: string; // Existing habit (anchor)
  stackedHabitId: string; // New habit to do after
  descriptionPattern: string; // e.g., "After I drink coffee, I will meditate for 5 min"
  isActive: boolean;
  createdAt: string;
}

// Journal Entry (Daily reflection)
// "Make it Satisfying" - Tracking progress
export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  content?: string; // Free-form journal text
  highlightWin?: string; // One win of the day
  highlightBlocker?: string; // One thing to improve
  mood?: number; // 1-5 scale
  linkedHabitIds?: string[]; // Habits reflected on
  linkedIdentityIds?: string[]; // Identities reinforced today
  createdAt: string;
}

// Streak (Intelligent streak with forgiveness)
// Forgiveness buffer: miss 1 day = warning, miss 2 consecutive = reset
export interface Streak {
  id: string;
  userId: string;
  habitId: string;
  currentStreakCount: number;
  bestStreakCount: number;
  lastCheckinDate: string; // YYYY-MM-DD
  missedConsecutiveDays: number; // Track consecutive misses for forgiveness logic
  forgivenessUsed: boolean; // Did we use the 1-day forgiveness?
  updatedAt: string;
}

// Challenge (Mini-challenges: daily, weekly, monthly)
// Gamification to boost engagement
export type ChallengeType = "daily" | "weekly" | "monthly";
export type ChallengeStatus = "active" | "completed" | "failed" | "upcoming";

export interface Challenge {
  id: string;
  userId?: string; // null for global challenges
  name: string;
  description: string;
  type: ChallengeType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetValue: number; // Goal to reach
  currentValue: number; // Current progress
  rewardBadgeId?: string; // Badge unlocked on completion
  status: ChallengeStatus;
  isPremium?: boolean; // Premium-only challenge
  createdAt: string;
}

// Strategy Tip (Library of Atomic Habits advice)
// Educational content aligned with the 4 Laws
export type StrategyCategory =
  | "MakeItObvious" // 1st Law
  | "MakeItAttractive" // 2nd Law
  | "MakeItEasy" // 3rd Law
  | "MakeItSatisfying"; // 4th Law

export interface StrategyTip {
  id: string;
  category: StrategyCategory;
  title: string;
  content: string; // Detailed explanation
  actionSteps: string[]; // 2-3 concrete actions
  suggestedFor?: string[]; // Habit types or situations (e.g., ["hard", "fitness"])
  isPremium?: boolean; // Premium content flag
  order?: number; // Display order
}

// Social Connection (Optional - Light social feature)
export type SocialStatus = "pending" | "accepted" | "rejected";

export interface SocialConnection {
  id: string;
  userId: string;
  friendUserId: string;
  status: SocialStatus;
  createdAt: string;
}

// Kudos (Social encouragement)
export interface Kudos {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string; // Short encouragement
  createdAt: string;
}

// ========================================
// ANALYTICS & STATS TYPES
// ========================================

export type DashboardPeriod = "day" | "week" | "month" | "year";

export interface ChartDataPoint {
  label: string; // X-axis label (e.g., "Mon", "Week 1")
  value: number; // Y-axis value (points, count, etc.)
}

// Identity Score (aggregated for dashboard)
export interface IdentityScore {
  identityId: string;
  identityName: string;
  totalPoints: number;
  habitCount: number;
  completionRate: number; // 0-100%
  color: string;
}

// System Score (aggregated for dashboard)
export interface SystemScore {
  systemId: string;
  systemName: string;
  totalPoints: number;
  habitCount: number;
  completionRate: number; // 0-100%
  targetRate: number; // Target completion rate
  color: string;
}

// Advanced Atomic Score calculation
export interface AtomicScoreBreakdown {
  totalScore: number;
  basePoints: number; // Raw check-in points
  difficultyBonus: number; // Bonus from hard habits
  streakBonus: number; // Bonus from maintaining streaks
  challengeBonus: number; // Bonus from completing challenges
  weeklyChange: number; // Change vs last week (%)
  monthlyChange: number; // Change vs last month (%)
}

// Coaching Suggestion (intelligent recommendations)
export type SuggestionType =
  | "reduce_difficulty"
  | "add_cue"
  | "habit_stack"
  | "join_system"
  | "reinforce_identity"
  | "environmental_design";

export interface CoachingSuggestion {
  id: string;
  type: SuggestionType;
  habitId?: string;
  title: string;
  description: string;
  actionLabel: string; // CTA button text
  priority: number; // 1-5, higher = more important
  createdAt: string;
}

// ========================================
// CONSTANTS & DEFAULTS
// ========================================

// Habit Colors (existing)
export const HABIT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

// Habit Icons (existing)
export const HABIT_ICONS = [
  "fitness",
  "water",
  "book",
  "cafe",
  "moon",
  "sunny",
  "bicycle",
  "barbell",
  "leaf",
  "heart",
  "flash",
  "time",
  "trophy",
  "musical-notes",
  "brush",
  "rocket",
  "bulb",
  "planet",
];

// Badge Templates (existing, can be extended)
export const BADGE_TEMPLATES = [
  {
    name: "First Step",
    description: "Complete your first habit check-in",
    iconName: "footsteps",
    conditionType: "first_step" as BadgeConditionType,
    conditionValue: 1,
  },
  {
    name: "Consistency 7",
    description: "Maintain a 7-day streak",
    iconName: "flame",
    conditionType: "streak" as BadgeConditionType,
    conditionValue: 7,
  },
  {
    name: "Consistency 30",
    description: "Maintain a 30-day streak",
    iconName: "flame",
    conditionType: "streak" as BadgeConditionType,
    conditionValue: 30,
  },
  {
    name: "Atomic 100",
    description: "Reach 100 ATOMIC points",
    iconName: "planet",
    conditionType: "total_points" as BadgeConditionType,
    conditionValue: 100,
  },
  {
    name: "Goal Crusher",
    description: "Complete 5 goals",
    iconName: "trophy",
    conditionType: "goals_completed" as BadgeConditionType,
    conditionValue: 5,
  },
  {
    name: "Habit Master",
    description: "Create 10 habits",
    iconName: "star",
    conditionType: "habits_created" as BadgeConditionType,
    conditionValue: 10,
  },
];

// Default Identities (seed data suggestions)
export const DEFAULT_IDENTITIES = [
  { name: "Athlete", color: "#10B981", iconName: "barbell" },
  { name: "Reader", color: "#8B5CF6", iconName: "book" },
  { name: "Entrepreneur", color: "#F59E0B", iconName: "rocket" },
  { name: "Artist", color: "#EC4899", iconName: "brush" },
  { name: "Mindful Person", color: "#06B6D4", iconName: "leaf" },
  { name: "Healthy Person", color: "#3B82F6", iconName: "heart" },
];

// Point Values by Difficulty
export const POINTS_BY_DIFFICULTY = {
  easy: 0.1,
  medium: 0.15,
  hard: 0.2,
};

// Streak Forgiveness Rules
export const FORGIVENESS_RULES = {
  maxConsecutiveMisses: 1, // Can miss 1 day without reset
  resetAfterMisses: 2, // Reset after 2 consecutive misses
  warningMessage: "You missed yesterday, but it's ok. Don't let the chain break twice!",
};

// Default Challenges (seed data)
export const DEFAULT_CHALLENGES = [
  {
    name: "7-Day Momentum",
    description: "Complete at least 1 habit for 7 consecutive days",
    type: "weekly" as ChallengeType,
    targetValue: 7,
  },
  {
    name: "Hard Mode",
    description: "Complete a hard habit 5 days in a week",
    type: "weekly" as ChallengeType,
    targetValue: 5,
  },
  {
    name: "System Master",
    description: "Achieve 80%+ completion rate in any system for 7 days",
    type: "weekly" as ChallengeType,
    targetValue: 7,
  },
];
