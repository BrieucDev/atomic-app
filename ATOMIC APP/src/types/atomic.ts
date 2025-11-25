// ========================================
// ATOMIC APP - DATA MODELS & TYPES
// ========================================

// User Profile
export interface User {
  id: string;
  name: string;
  bio: string;
  profilePictureUrl: string | null;
  createdAt: string; // ISO date string
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

// Habit (Main recurring activity)
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: HabitType;
  category: HabitCategory;
  color: string; // Hex color
  iconName: string; // Icon name from @expo/vector-icons
  isActive: boolean;
  createdAt: string; // ISO date string

  // V2 Extensions - Atomic Habits Alignment
  difficulty?: HabitDifficulty; // Easy = 0.1pts, Medium = 0.15pts, Hard = 0.2pts
  linkedIdentityIds?: string[]; // Identities this habit reinforces
  systemId?: string; // System this habit belongs to
  environmentTips?: string; // Tips to prepare environment (anti-friction)
  enableHabitStacking?: boolean; // Is this habit part of a stack?
  stackedAfterHabitId?: string; // If stacked, which habit comes before?
}

// Habit Check-in (One per habit per day)
// Each check-in = 1 unit = 0.1 ATOMIC points
export interface HabitCheckin {
  id: string;
  habitId: string;
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD format for easy comparison)
  atomicPoints: number; // Default: 0.1
  createdAt: string; // ISO date string
}

// Goal Type
export type GoalType = "habit_based" | "action_based";

// Goal Period
export type GoalPeriod = "weekly" | "monthly";

// Goal (Weekly or Monthly objectives)
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  period: GoalPeriod;
  targetValue: number; // Number of completions needed
  currentValue: number; // Current progress
  linkedHabitIds: string[]; // For habit_based goals
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isCompleted: boolean;
  createdAt: string; // ISO date string
}

// Badge Condition Types
export type BadgeConditionType = "streak" | "total_points" | "goals_completed" | "habits_created" | "first_step";

// Badge (Achievements)
export interface Badge {
  id: string;
  userId: string;
  name: string;
  description: string;
  iconName: string; // Icon name from @expo/vector-icons
  conditionType: BadgeConditionType;
  conditionValue: number; // Threshold to unlock
  obtainedAt: string | null; // ISO date string or null if not obtained
  createdAt: string; // ISO date string
}

// ========================================
// FILTER TYPES FOR DASHBOARD
// ========================================
export type DashboardPeriod = "day" | "week" | "month" | "year";

// ========================================
// STATS & ANALYTICS TYPES
// ========================================

// Stats for a specific period
export interface PeriodStats {
  period: DashboardPeriod;
  totalAtomicPoints: number;
  habitsCompleted: number;
  totalHabitsActive: number;
  completionRate: number; // Percentage
  bestStreak: number;
  currentStreak: number;
}

// Data for charts
export interface ChartDataPoint {
  label: string; // Date or day name
  value: number; // Points or count
  date?: string; // ISO date for reference
}

// Streak information
export interface StreakInfo {
  habitId: string;
  habitTitle: string;
  currentStreak: number;
  bestStreak: number;
  color: string;
}

// ========================================
// PREDEFINED BADGE TEMPLATES
// ========================================
export interface BadgeTemplate {
  name: string;
  description: string;
  iconName: string;
  conditionType: BadgeConditionType;
  conditionValue: number;
}

export const BADGE_TEMPLATES: BadgeTemplate[] = [
  {
    name: "First Step",
    description: "Complete your first habit",
    iconName: "flag",
    conditionType: "first_step",
    conditionValue: 1,
  },
  {
    name: "Consistency 7",
    description: "Complete at least 1 habit for 7 days in a row",
    iconName: "flame",
    conditionType: "streak",
    conditionValue: 7,
  },
  {
    name: "Consistency 30",
    description: "Complete at least 1 habit for 30 days in a row",
    iconName: "flame-outline",
    conditionType: "streak",
    conditionValue: 30,
  },
  {
    name: "Atomic 100",
    description: "Reach 100 ATOMIC points",
    iconName: "star",
    conditionType: "total_points",
    conditionValue: 100,
  },
  {
    name: "Atomic 500",
    description: "Reach 500 ATOMIC points",
    iconName: "star-outline",
    conditionType: "total_points",
    conditionValue: 500,
  },
  {
    name: "Goal Crusher",
    description: "Complete 5 goals",
    iconName: "trophy",
    conditionType: "goals_completed",
    conditionValue: 5,
  },
  {
    name: "Goal Master",
    description: "Complete 20 goals",
    iconName: "trophy-outline",
    conditionType: "goals_completed",
    conditionValue: 20,
  },
  {
    name: "Habit Builder",
    description: "Create 10 habits",
    iconName: "build",
    conditionType: "habits_created",
    conditionValue: 10,
  },
];

// ========================================
// DEFAULT COLORS FOR HABITS
// ========================================
export const HABIT_COLORS = [
  "#3B82F6", // Blue (primary)
  "#06B6D4", // Cyan
  "#0EA5E9", // Light blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple (accent)
  "#EC4899", // Pink
  "#10B981", // Green
  "#F59E0B", // Amber
];

// ========================================
// ICON OPTIONS FOR HABITS
// ========================================
export const HABIT_ICONS = [
  "fitness",
  "heart",
  "book",
  "briefcase",
  "water",
  "bed",
  "restaurant",
  "bicycle",
  "walk",
  "headset",
  "school",
  "bulb",
  "leaf",
  "checkmark-circle",
  "star",
  "rocket",
  "trophy",
  "medal",
];
