// ========================================
// ATOMIC APP - ZUSTAND STORE WITH PERSISTENCE
// ========================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Habit,
  HabitCheckin,
  Goal,
  Badge,
  BADGE_TEMPLATES
} from "../types/atomic";
import {
  Identity,
  System,
  Cue,
  HabitStack,
  JournalEntry,
  Streak,
  Challenge,
  ChallengeStatus,
  StrategyTip,
  CoachingSuggestion,
  HabitDifficulty,
  POINTS_BY_DIFFICULTY,
  FORGIVENESS_RULES,
  DEFAULT_IDENTITIES,
  DEFAULT_CHALLENGES,
} from "../types/atomicV2";
import { format, startOfDay, parseISO, isToday, differenceInDays } from "date-fns";

// ========================================
// STORE INTERFACE
// ========================================

interface AtomicStore {
  // ========================================
  // V1 STATE
  // ========================================

  // User data
  user: User | null;

  // Auth state
  hasCompletedOnboarding: boolean;
  hasSeenTutorial: boolean;

  // Habits
  habits: Habit[];

  // Check-ins
  checkins: HabitCheckin[];

  // Goals
  goals: Goal[];

  // Badges
  badges: Badge[];

  // ========================================
  // V2 STATE - ATOMIC HABITS FEATURES
  // ========================================

  // Identities (who you want to become)
  identities: Identity[];

  // Systems (groups of habits)
  systems: System[];

  // Cues (triggers for habits)
  cues: Cue[];

  // Habit Stacks (after X, I will Y)
  habitStacks: HabitStack[];

  // Journal Entries (daily reflection)
  journalEntries: JournalEntry[];

  // Streaks (intelligent with forgiveness)
  streaks: Streak[];

  // Challenges (mini-challenges)
  challenges: Challenge[];

  // Strategy Tips (educational content)
  strategyTips: StrategyTip[];

  // Coaching Suggestions (intelligent recommendations)
  coachingSuggestions: CoachingSuggestion[];

  // ========================================
  // V1 USER ACTIONS
  // ========================================

  initializeUser: () => void;
  createAccount: (name: string, email: string, password: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  completeOnboarding: () => void;
  completeTutorial: () => void;

  // ========================================
  // V1 HABIT ACTIONS
  // ========================================

  addHabit: (habit: Omit<Habit, "id" | "userId" | "createdAt" | "isActive">) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;

  // ========================================
  // V1 CHECK-IN ACTIONS
  // ========================================

  checkInHabit: (habitId: string, date?: string) => void;
  uncheckHabit: (habitId: string, date?: string) => void;
  isHabitCheckedToday: (habitId: string, date?: string) => boolean;

  // ========================================
  // V1 GOAL ACTIONS
  // ========================================

  addGoal: (goal: Omit<Goal, "id" | "userId" | "createdAt" | "currentValue" | "isCompleted">) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  incrementGoalProgress: (goalId: string) => void;

  // ========================================
  // V1 BADGE ACTIONS
  // ========================================

  checkAndUnlockBadges: () => void;

  // ========================================
  // V2 IDENTITY ACTIONS
  // ========================================

  addIdentity: (identity: Omit<Identity, "id" | "userId" | "createdAt">) => void;
  updateIdentity: (identityId: string, updates: Partial<Identity>) => void;
  deleteIdentity: (identityId: string) => void;
  getIdentityScore: (identityId: string) => { totalPoints: number; habitCount: number; completionRate: number };

  // ========================================
  // V2 SYSTEM ACTIONS
  // ========================================

  addSystem: (system: Omit<System, "id" | "userId" | "createdAt">) => void;
  updateSystem: (systemId: string, updates: Partial<System>) => void;
  deleteSystem: (systemId: string) => void;
  getSystemScore: (systemId: string) => { totalPoints: number; habitCount: number; completionRate: number };

  // ========================================
  // V2 CUE ACTIONS
  // ========================================

  addCue: (cue: Omit<Cue, "id" | "createdAt">) => void;
  updateCue: (cueId: string, updates: Partial<Cue>) => void;
  deleteCue: (cueId: string) => void;

  // ========================================
  // V2 HABIT STACK ACTIONS
  // ========================================

  addHabitStack: (stack: Omit<HabitStack, "id" | "createdAt">) => void;
  updateHabitStack: (stackId: string, updates: Partial<HabitStack>) => void;
  deleteHabitStack: (stackId: string) => void;

  // ========================================
  // V2 JOURNAL ACTIONS
  // ========================================

  addJournalEntry: (entry: Omit<JournalEntry, "id" | "createdAt">) => void;
  updateJournalEntry: (entryId: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (entryId: string) => void;
  getJournalEntry: (date: string) => JournalEntry | undefined;

  // ========================================
  // V2 CHALLENGE ACTIONS
  // ========================================

  addChallenge: (challenge: Omit<Challenge, "id" | "createdAt">) => void;
  updateChallenge: (challengeId: string, updates: Partial<Challenge>) => void;
  deleteChallenge: (challengeId: string) => void;
  updateChallengeProgress: () => void;

  // ========================================
  // V2 STREAK ACTIONS (INTELLIGENT WITH FORGIVENESS)
  // ========================================

  updateStreaks: () => void;
  getHabitStreakV2: (habitId: string) => Streak | undefined;

  // ========================================
  // V2 COACHING ACTIONS
  // ========================================

  generateCoachingSuggestions: () => void;
  dismissSuggestion: (suggestionId: string) => void;

  // ========================================
  // V1 COMPUTED VALUES / GETTERS
  // ========================================

  getTotalAtomicPoints: () => number;
  getCurrentStreak: () => number;
  getBestStreak: () => number;
  getHabitStreak: (habitId: string) => { current: number; best: number };
  getCheckinsForPeriod: (startDate: string, endDate: string) => HabitCheckin[];
  getPointsForPeriod: (startDate: string, endDate: string) => number;

  // ========================================
  // V2 COMPUTED VALUES / GETTERS
  // ========================================

  getAtomicScoreV2: () => number;
  getAdvancedAtomicScore: () => {
    totalScore: number;
    basePoints: number;
    difficultyBonus: number;
    streakBonus: number;
    challengeBonus: number;
  };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const formatDateKey = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(startOfDay(d), "yyyy-MM-dd");
};

// ========================================
// STORE IMPLEMENTATION
// ========================================

const useAtomicStore = create<AtomicStore>()(
  persist(
    (set, get) => ({
      // ========================================
      // V1 INITIAL STATE
      // ========================================
      user: null,
      habits: [],
      checkins: [],
      goals: [],
      badges: [],
      hasCompletedOnboarding: false,
      hasSeenTutorial: false,

      // ========================================
      // V2 INITIAL STATE
      // ========================================
      identities: [],
      systems: [],
      cues: [],
      habitStacks: [],
      journalEntries: [],
      streaks: [],
      challenges: [],
      strategyTips: [],
      coachingSuggestions: [],

      // ========================================
      // USER ACTIONS
      // ========================================

      initializeUser: () => {
        const { user } = get();
        if (!user) {
          const newUser: User = {
            id: generateId(),
            name: "User",
            bio: "Building better habits, one day at a time",
            profilePictureUrl: null,
            createdAt: new Date().toISOString(),
          };
          set({ user: newUser });

          // Initialize default badges
          const initialBadges: Badge[] = BADGE_TEMPLATES.map((template) => ({
            id: generateId(),
            userId: newUser.id,
            name: template.name,
            description: template.description,
            iconName: template.iconName,
            conditionType: template.conditionType,
            conditionValue: template.conditionValue,
            obtainedAt: null,
            createdAt: new Date().toISOString(),
          }));
          set({ badges: initialBadges });
        }
      },

      createAccount: (name: string, email: string, password: string) => {
        const newUser: User = {
          id: generateId(),
          name,
          bio: "Building better habits, one day at a time",
          profilePictureUrl: null,
          createdAt: new Date().toISOString(),
        };

        // Initialize default badges
        const initialBadges: Badge[] = BADGE_TEMPLATES.map((template) => ({
          id: generateId(),
          userId: newUser.id,
          name: template.name,
          description: template.description,
          iconName: template.iconName,
          conditionType: template.conditionType,
          conditionValue: template.conditionValue,
          obtainedAt: null,
          createdAt: new Date().toISOString(),
        }));

        set({
          user: newUser,
          badges: initialBadges,
          hasCompletedOnboarding: true,
        });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      logout: () => {
        set({
          user: null,
          habits: [],
          checkins: [],
          goals: [],
          badges: [],
          hasCompletedOnboarding: false,
          hasSeenTutorial: false,
          // Reset V2 state
          identities: [],
          systems: [],
          cues: [],
          habitStacks: [],
          journalEntries: [],
          streaks: [],
          challenges: [],
          strategyTips: [],
          coachingSuggestions: [],
        });
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

      completeTutorial: () => {
        set({ hasSeenTutorial: true });
      },

      // ========================================
      // HABIT ACTIONS
      // ========================================

      addHabit: (habitData) => {
        const { user, habits } = get();
        if (!user) return;

        const newHabit: Habit = {
          ...habitData,
          id: generateId(),
          userId: user.id,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        set({ habits: [...habits, newHabit] });
        get().checkAndUnlockBadges();
      },

      updateHabit: (habitId, updates) => {
        const { habits } = get();
        set({
          habits: habits.map((h) =>
            h.id === habitId ? { ...h, ...updates } : h
          ),
        });
      },

      deleteHabit: (habitId) => {
        const { habits, checkins, goals } = get();

        // Remove habit
        set({ habits: habits.filter((h) => h.id !== habitId) });

        // Remove related check-ins
        set({ checkins: checkins.filter((c) => c.habitId !== habitId) });

        // Update goals that reference this habit
        set({
          goals: goals.map((g) => ({
            ...g,
            linkedHabitIds: g.linkedHabitIds.filter((id) => id !== habitId),
          })),
        });
      },

      // ========================================
      // CHECK-IN ACTIONS
      // ========================================

      checkInHabit: (habitId, date) => {
        const { user, checkins, habits, goals } = get();
        if (!user) return;

        const targetDate = date || formatDateKey(new Date());

        // Check if already checked in for this date
        const existingCheckin = checkins.find(
          (c) => c.habitId === habitId && c.date === targetDate
        );

        if (existingCheckin) return; // Already checked in

        // Create new check-in (0.1 points per check-in)
        const newCheckin: HabitCheckin = {
          id: generateId(),
          habitId,
          userId: user.id,
          date: targetDate,
          atomicPoints: 0.1,
          createdAt: new Date().toISOString(),
        };

        set({ checkins: [...checkins, newCheckin] });

        // Update habit-based goals
        const habit = habits.find((h) => h.id === habitId);
        if (habit) {
          const updatedGoals = goals.map((goal) => {
            if (
              goal.goalType === "habit_based" &&
              goal.linkedHabitIds.includes(habitId) &&
              !goal.isCompleted
            ) {
              const newCurrentValue = goal.currentValue + 1;
              return {
                ...goal,
                currentValue: newCurrentValue,
                isCompleted: newCurrentValue >= goal.targetValue,
              };
            }
            return goal;
          });
          set({ goals: updatedGoals });
        }

        // Check for badge unlocks
        get().checkAndUnlockBadges();
      },

      uncheckHabit: (habitId, date) => {
        const { checkins, goals } = get();
        const targetDate = date || formatDateKey(new Date());

        // Remove check-in
        const updatedCheckins = checkins.filter(
          (c) => !(c.habitId === habitId && c.date === targetDate)
        );
        set({ checkins: updatedCheckins });

        // Update habit-based goals (decrement)
        const updatedGoals = goals.map((goal) => {
          if (
            goal.goalType === "habit_based" &&
            goal.linkedHabitIds.includes(habitId)
          ) {
            const newCurrentValue = Math.max(0, goal.currentValue - 1);
            return {
              ...goal,
              currentValue: newCurrentValue,
              isCompleted: newCurrentValue >= goal.targetValue,
            };
          }
          return goal;
        });
        set({ goals: updatedGoals });
      },

      isHabitCheckedToday: (habitId, date) => {
        const { checkins } = get();
        const targetDate = date || formatDateKey(new Date());
        return checkins.some(
          (c) => c.habitId === habitId && c.date === targetDate
        );
      },

      // ========================================
      // GOAL ACTIONS
      // ========================================

      addGoal: (goalData) => {
        const { user, goals } = get();
        if (!user) return;

        const newGoal: Goal = {
          ...goalData,
          id: generateId(),
          userId: user.id,
          currentValue: 0,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };

        set({ goals: [...goals, newGoal] });
      },

      updateGoal: (goalId, updates) => {
        const { goals } = get();
        set({
          goals: goals.map((g) =>
            g.id === goalId ? { ...g, ...updates } : g
          ),
        });
      },

      deleteGoal: (goalId) => {
        const { goals } = get();
        set({ goals: goals.filter((g) => g.id !== goalId) });
      },

      incrementGoalProgress: (goalId) => {
        const { goals } = get();
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId && !goal.isCompleted) {
            const newCurrentValue = goal.currentValue + 1;
            return {
              ...goal,
              currentValue: newCurrentValue,
              isCompleted: newCurrentValue >= goal.targetValue,
            };
          }
          return goal;
        });
        set({ goals: updatedGoals });
        get().checkAndUnlockBadges();
      },

      // ========================================
      // BADGE ACTIONS
      // ========================================

      checkAndUnlockBadges: () => {
        const { badges, habits } = get();
        const totalPoints = get().getTotalAtomicPoints();
        const currentStreak = get().getCurrentStreak();
        const completedGoals = get().goals.filter((g) => g.isCompleted).length;
        const totalHabits = habits.length;

        const updatedBadges = badges.map((badge) => {
          if (badge.obtainedAt) return badge; // Already unlocked

          let shouldUnlock = false;

          switch (badge.conditionType) {
            case "first_step":
              shouldUnlock = get().checkins.length >= badge.conditionValue;
              break;
            case "streak":
              shouldUnlock = currentStreak >= badge.conditionValue;
              break;
            case "total_points":
              shouldUnlock = totalPoints >= badge.conditionValue;
              break;
            case "goals_completed":
              shouldUnlock = completedGoals >= badge.conditionValue;
              break;
            case "habits_created":
              shouldUnlock = totalHabits >= badge.conditionValue;
              break;
          }

          if (shouldUnlock) {
            return {
              ...badge,
              obtainedAt: new Date().toISOString(),
            };
          }

          return badge;
        });

        set({ badges: updatedBadges });
      },

      // ========================================
      // COMPUTED VALUES / GETTERS
      // ========================================

      getTotalAtomicPoints: () => {
        const { checkins } = get();
        return checkins.reduce((sum, c) => sum + c.atomicPoints, 0);
      },

      getCurrentStreak: () => {
        const { checkins } = get();
        if (checkins.length === 0) return 0;

        // Sort check-ins by date (most recent first)
        const sortedCheckins = [...checkins].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Get unique dates
        const uniqueDates = Array.from(
          new Set(sortedCheckins.map((c) => c.date))
        ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (uniqueDates.length === 0) return 0;

        // Check if the streak is current (includes today or yesterday)
        const today = formatDateKey(new Date());
        const yesterday = formatDateKey(
          new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
          return 0; // Streak broken
        }

        // Count consecutive days
        let streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const dayDiff = differenceInDays(
            parseISO(uniqueDates[i - 1]),
            parseISO(uniqueDates[i])
          );
          if (dayDiff === 1) {
            streak++;
          } else {
            break;
          }
        }

        return streak;
      },

      getBestStreak: () => {
        const { checkins } = get();
        if (checkins.length === 0) return 0;

        // Get unique dates sorted
        const uniqueDates = Array.from(
          new Set(checkins.map((c) => c.date))
        ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        let bestStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
          const dayDiff = differenceInDays(
            parseISO(uniqueDates[i]),
            parseISO(uniqueDates[i - 1])
          );

          if (dayDiff === 1) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }

        return bestStreak;
      },

      getHabitStreak: (habitId) => {
        const { checkins } = get();
        const habitCheckins = checkins
          .filter((c) => c.habitId === habitId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (habitCheckins.length === 0) {
          return { current: 0, best: 0 };
        }

        // Current streak
        const today = formatDateKey(new Date());
        const yesterday = formatDateKey(
          new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        let current = 0;
        if (
          habitCheckins[0].date === today ||
          habitCheckins[0].date === yesterday
        ) {
          current = 1;
          for (let i = 1; i < habitCheckins.length; i++) {
            const dayDiff = differenceInDays(
              parseISO(habitCheckins[i - 1].date),
              parseISO(habitCheckins[i].date)
            );
            if (dayDiff === 1) {
              current++;
            } else {
              break;
            }
          }
        }

        // Best streak
        const dates = habitCheckins
          .map((c) => c.date)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        let best = 1;
        let tempStreak = 1;

        for (let i = 1; i < dates.length; i++) {
          const dayDiff = differenceInDays(
            parseISO(dates[i]),
            parseISO(dates[i - 1])
          );

          if (dayDiff === 1) {
            tempStreak++;
            best = Math.max(best, tempStreak);
          } else {
            tempStreak = 1;
          }
        }

        return { current, best };
      },

      getCheckinsForPeriod: (startDate, endDate) => {
        const { checkins } = get();
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        return checkins.filter((c) => {
          const date = parseISO(c.date);
          return date >= start && date <= end;
        });
      },

      getPointsForPeriod: (startDate, endDate) => {
        const checkinsInPeriod = get().getCheckinsForPeriod(startDate, endDate);
        return checkinsInPeriod.reduce((sum, c) => sum + c.atomicPoints, 0);
      },

      // ========================================
      // V2 IDENTITY ACTIONS
      // ========================================

      addIdentity: (identityData) => {
        const { user, identities } = get();
        if (!user) return;

        const newIdentity: Identity = {
          ...identityData,
          id: generateId(),
          userId: user.id,
          createdAt: new Date().toISOString(),
        };

        set({ identities: [...identities, newIdentity] });
      },

      updateIdentity: (identityId, updates) => {
        const { identities } = get();
        set({
          identities: identities.map((i) =>
            i.id === identityId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        });
      },

      deleteIdentity: (identityId) => {
        const { identities, habits } = get();

        // Remove identity
        set({ identities: identities.filter((i) => i.id !== identityId) });

        // Remove identity from habits
        set({
          habits: habits.map((h) => ({
            ...h,
            linkedIdentityIds: h.linkedIdentityIds?.filter((id) => id !== identityId),
          })),
        });
      },

      getIdentityScore: (identityId) => {
        const { habits, checkins } = get();

        // Get habits linked to this identity
        const identityHabits = habits.filter((h) =>
          h.linkedIdentityIds?.includes(identityId)
        );

        if (identityHabits.length === 0) {
          return { totalPoints: 0, habitCount: 0, completionRate: 0 };
        }

        // Calculate total points from these habits
        const identityHabitIds = identityHabits.map((h) => h.id);
        const identityCheckins = checkins.filter((c) =>
          identityHabitIds.includes(c.habitId)
        );
        const totalPoints = identityCheckins.reduce((sum, c) => sum + c.atomicPoints, 0);

        // Calculate completion rate (today)
        const today = formatDateKey(new Date());
        const todayCheckins = identityCheckins.filter((c) => c.date === today);
        const completionRate = identityHabits.length > 0
          ? (todayCheckins.length / identityHabits.length) * 100
          : 0;

        return {
          totalPoints,
          habitCount: identityHabits.length,
          completionRate,
        };
      },

      // ========================================
      // V2 SYSTEM ACTIONS
      // ========================================

      addSystem: (systemData) => {
        const { user, systems } = get();
        if (!user) return;

        const newSystem: System = {
          ...systemData,
          id: generateId(),
          userId: user.id,
          createdAt: new Date().toISOString(),
        };

        set({ systems: [...systems, newSystem] });
      },

      updateSystem: (systemId, updates) => {
        const { systems } = get();
        set({
          systems: systems.map((s) =>
            s.id === systemId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        });
      },

      deleteSystem: (systemId) => {
        const { systems, habits } = get();

        // Remove system
        set({ systems: systems.filter((s) => s.id !== systemId) });

        // Remove system from habits
        set({
          habits: habits.map((h) => ({
            ...h,
            systemId: h.systemId === systemId ? undefined : h.systemId,
          })),
        });
      },

      getSystemScore: (systemId) => {
        const { habits, checkins, systems } = get();

        const system = systems.find((s) => s.id === systemId);
        if (!system) {
          return { totalPoints: 0, habitCount: 0, completionRate: 0 };
        }

        // Get habits in this system
        const systemHabits = habits.filter((h) => h.systemId === systemId);

        if (systemHabits.length === 0) {
          return { totalPoints: 0, habitCount: 0, completionRate: 0 };
        }

        // Calculate total points
        const systemHabitIds = systemHabits.map((h) => h.id);
        const systemCheckins = checkins.filter((c) =>
          systemHabitIds.includes(c.habitId)
        );
        const totalPoints = systemCheckins.reduce((sum, c) => sum + c.atomicPoints, 0);

        // Calculate completion rate (today)
        const today = formatDateKey(new Date());
        const todayCheckins = systemCheckins.filter((c) => c.date === today);
        const completionRate = systemHabits.length > 0
          ? (todayCheckins.length / systemHabits.length) * 100
          : 0;

        return {
          totalPoints,
          habitCount: systemHabits.length,
          completionRate,
        };
      },

      // ========================================
      // V2 CUE ACTIONS
      // ========================================

      addCue: (cueData) => {
        const { cues } = get();

        const newCue: Cue = {
          ...cueData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set({ cues: [...cues, newCue] });
      },

      updateCue: (cueId, updates) => {
        const { cues } = get();
        set({
          cues: cues.map((c) =>
            c.id === cueId ? { ...c, ...updates } : c
          ),
        });
      },

      deleteCue: (cueId) => {
        const { cues } = get();
        set({ cues: cues.filter((c) => c.id !== cueId) });
      },

      // ========================================
      // V2 HABIT STACK ACTIONS
      // ========================================

      addHabitStack: (stackData) => {
        const { habitStacks } = get();

        const newStack: HabitStack = {
          ...stackData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set({ habitStacks: [...habitStacks, newStack] });
      },

      updateHabitStack: (stackId, updates) => {
        const { habitStacks } = get();
        set({
          habitStacks: habitStacks.map((s) =>
            s.id === stackId ? { ...s, ...updates } : s
          ),
        });
      },

      deleteHabitStack: (stackId) => {
        const { habitStacks } = get();
        set({ habitStacks: habitStacks.filter((s) => s.id !== stackId) });
      },

      // ========================================
      // V2 JOURNAL ACTIONS
      // ========================================

      addJournalEntry: (entryData) => {
        const { journalEntries } = get();

        const newEntry: JournalEntry = {
          ...entryData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set({ journalEntries: [...journalEntries, newEntry] });
      },

      updateJournalEntry: (entryId, updates) => {
        const { journalEntries } = get();
        set({
          journalEntries: journalEntries.map((e) =>
            e.id === entryId ? { ...e, ...updates } : e
          ),
        });
      },

      deleteJournalEntry: (entryId) => {
        const { journalEntries } = get();
        set({ journalEntries: journalEntries.filter((e) => e.id !== entryId) });
      },

      getJournalEntry: (date) => {
        const { journalEntries } = get();
        return journalEntries.find((e) => e.date === date);
      },

      // ========================================
      // V2 CHALLENGE ACTIONS
      // ========================================

      addChallenge: (challengeData) => {
        const { challenges } = get();

        const newChallenge: Challenge = {
          ...challengeData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set({ challenges: [...challenges, newChallenge] });
      },

      updateChallenge: (challengeId, updates) => {
        const { challenges } = get();
        set({
          challenges: challenges.map((c) =>
            c.id === challengeId ? { ...c, ...updates } : c
          ),
        });
      },

      deleteChallenge: (challengeId) => {
        const { challenges } = get();
        set({ challenges: challenges.filter((c) => c.id !== challengeId) });
      },

      updateChallengeProgress: () => {
        const { challenges, checkins } = get();
        const today = formatDateKey(new Date());

        const updatedChallenges = challenges.map((challenge) => {
          if (challenge.status === "completed" || challenge.status === "failed") {
            return challenge;
          }

          // Check if challenge is active
          const startDate = parseISO(challenge.startDate);
          const endDate = parseISO(challenge.endDate);
          const todayDate = parseISO(today);

          if (todayDate < startDate) {
            return { ...challenge, status: "upcoming" as const };
          }

          if (todayDate > endDate) {
            const finalStatus: ChallengeStatus = challenge.currentValue >= challenge.targetValue ? "completed" : "failed";
            return {
              ...challenge,
              status: finalStatus
            };
          }

          // Calculate current progress based on challenge type
          let currentValue = 0;

          if (challenge.type === "daily") {
            // Count today's check-ins
            currentValue = checkins.filter((c) => c.date === today).length;
          } else if (challenge.type === "weekly") {
            // Count this week's check-ins
            const checkinsInPeriod = get().getCheckinsForPeriod(challenge.startDate, challenge.endDate);
            currentValue = checkinsInPeriod.length;
          } else if (challenge.type === "monthly") {
            // Count this month's check-ins
            const checkinsInPeriod = get().getCheckinsForPeriod(challenge.startDate, challenge.endDate);
            currentValue = checkinsInPeriod.length;
          }

          const isCompleted = currentValue >= challenge.targetValue;

          return {
            ...challenge,
            currentValue,
            status: isCompleted ? ("completed" as const) : ("active" as const),
          };
        });

        set({ challenges: updatedChallenges });
      },

      // ========================================
      // V2 STREAK ACTIONS (INTELLIGENT WITH FORGIVENESS)
      // ========================================

      updateStreaks: () => {
        const { habits, checkins, streaks } = get();
        const today = formatDateKey(new Date());
        const yesterday = formatDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

        const updatedStreaks = habits.map((habit) => {
          const existingStreak = streaks.find((s) => s.habitId === habit.id);
          const habitCheckins = checkins
            .filter((c) => c.habitId === habit.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (habitCheckins.length === 0) {
            return existingStreak || {
              id: generateId(),
              userId: habit.userId,
              habitId: habit.id,
              currentStreakCount: 0,
              bestStreakCount: 0,
              lastCheckinDate: "",
              missedConsecutiveDays: 0,
              forgivenessUsed: false,
              updatedAt: new Date().toISOString(),
            };
          }

          const lastCheckinDate = habitCheckins[0].date;
          const daysSinceLastCheckin = differenceInDays(parseISO(today), parseISO(lastCheckinDate));

          let currentStreakCount = 0;
          let missedConsecutiveDays = 0;
          let forgivenessUsed = existingStreak?.forgivenessUsed || false;

          // Calculate current streak with forgiveness logic
          if (daysSinceLastCheckin === 0) {
            // Checked in today
            currentStreakCount = 1;
            for (let i = 1; i < habitCheckins.length; i++) {
              const dayDiff = differenceInDays(
                parseISO(habitCheckins[i - 1].date),
                parseISO(habitCheckins[i].date)
              );
              if (dayDiff === 1) {
                currentStreakCount++;
              } else {
                break;
              }
            }
            missedConsecutiveDays = 0;
            forgivenessUsed = false;
          } else if (daysSinceLastCheckin === 1) {
            // Missed today, but checked in yesterday (forgiveness)
            if (!forgivenessUsed) {
              currentStreakCount = existingStreak?.currentStreakCount || 1;
              missedConsecutiveDays = 1;
              forgivenessUsed = true;
            } else {
              // Already used forgiveness, streak resets
              currentStreakCount = 0;
              missedConsecutiveDays = daysSinceLastCheckin;
              forgivenessUsed = false;
            }
          } else if (daysSinceLastCheckin >= 2) {
            // Missed 2+ days, streak resets
            currentStreakCount = 0;
            missedConsecutiveDays = daysSinceLastCheckin;
            forgivenessUsed = false;
          }

          // Calculate best streak
          const dates = habitCheckins
            .map((c) => c.date)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

          let bestStreakCount = 1;
          let tempStreak = 1;

          for (let i = 1; i < dates.length; i++) {
            const dayDiff = differenceInDays(parseISO(dates[i]), parseISO(dates[i - 1]));
            if (dayDiff === 1) {
              tempStreak++;
              bestStreakCount = Math.max(bestStreakCount, tempStreak);
            } else {
              tempStreak = 1;
            }
          }

          bestStreakCount = Math.max(bestStreakCount, existingStreak?.bestStreakCount || 0);

          return {
            id: existingStreak?.id || generateId(),
            userId: habit.userId,
            habitId: habit.id,
            currentStreakCount,
            bestStreakCount,
            lastCheckinDate,
            missedConsecutiveDays,
            forgivenessUsed,
            updatedAt: new Date().toISOString(),
          };
        });

        set({ streaks: updatedStreaks });
      },

      getHabitStreakV2: (habitId) => {
        const { streaks } = get();
        return streaks.find((s) => s.habitId === habitId);
      },

      // ========================================
      // V2 COACHING ACTIONS
      // ========================================

      generateCoachingSuggestions: () => {
        const { habits, checkins, coachingSuggestions } = get();
        const today = formatDateKey(new Date());
        const last7Days = formatDateKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

        const newSuggestions: CoachingSuggestion[] = [];

        // Analyze each habit for potential suggestions
        habits.forEach((habit) => {
          const habitCheckins = checkins.filter(
            (c) => c.habitId === habit.id && c.date >= last7Days && c.date <= today
          );

          const completionRate = habitCheckins.length / 7;

          // Suggest difficulty reduction for struggling habits
          if (completionRate < 0.3 && habit.difficulty === "hard") {
            const existingSuggestion = coachingSuggestions.find(
              (s) => s.habitId === habit.id && s.type === "reduce_difficulty"
            );

            if (!existingSuggestion) {
              newSuggestions.push({
                id: generateId(),
                type: "reduce_difficulty",
                habitId: habit.id,
                title: `Make "${habit.title}" easier`,
                description: "You are struggling with this habit. Consider reducing its difficulty or breaking it into smaller steps.",
                actionLabel: "Reduce Difficulty",
                priority: 5,
                createdAt: new Date().toISOString(),
              });
            }
          }

          // Suggest adding cues for habits without them
          const habitCues = get().cues.filter((c) => c.habitId === habit.id);
          if (habitCues.length === 0 && completionRate < 0.5) {
            const existingSuggestion = coachingSuggestions.find(
              (s) => s.habitId === habit.id && s.type === "add_cue"
            );

            if (!existingSuggestion) {
              newSuggestions.push({
                id: generateId(),
                type: "add_cue",
                habitId: habit.id,
                title: `Add a trigger for "${habit.title}"`,
                description: "Make it Obvious: Set a specific time, location, or context to trigger this habit.",
                actionLabel: "Add Cue",
                priority: 4,
                createdAt: new Date().toISOString(),
              });
            }
          }
        });

        set({ coachingSuggestions: [...coachingSuggestions, ...newSuggestions] });
      },

      dismissSuggestion: (suggestionId) => {
        const { coachingSuggestions } = get();
        set({
          coachingSuggestions: coachingSuggestions.filter((s) => s.id !== suggestionId),
        });
      },

      // ========================================
      // V2 COMPUTED VALUES / GETTERS
      // ========================================

      getAtomicScoreV2: () => {
        const { checkins, habits } = get();

        // Calculate score with difficulty multipliers
        let totalScore = 0;

        checkins.forEach((checkin) => {
          const habit = habits.find((h) => h.id === checkin.habitId);
          if (habit?.difficulty) {
            totalScore += POINTS_BY_DIFFICULTY[habit.difficulty];
          } else {
            totalScore += 0.1; // Default for habits without difficulty
          }
        });

        return totalScore;
      },

      getAdvancedAtomicScore: () => {
        const { checkins, habits, streaks, challenges } = get();

        // Base points with difficulty
        let basePoints = 0;
        let difficultyBonus = 0;

        checkins.forEach((checkin) => {
          const habit = habits.find((h) => h.id === checkin.habitId);
          const points = habit?.difficulty
            ? POINTS_BY_DIFFICULTY[habit.difficulty]
            : 0.1;

          basePoints += 0.1; // Base

          if (habit?.difficulty === "medium") {
            difficultyBonus += 0.05;
          } else if (habit?.difficulty === "hard") {
            difficultyBonus += 0.1;
          }
        });

        // Streak bonus (0.05 per active streak over 7 days)
        const streakBonus = streaks.reduce((sum, streak) => {
          if (streak.currentStreakCount >= 7) {
            return sum + (Math.floor(streak.currentStreakCount / 7) * 0.05);
          }
          return sum;
        }, 0);

        // Challenge bonus (1 point per completed challenge)
        const challengeBonus = challenges.filter((c) => c.status === "completed").length;

        const totalScore = basePoints + difficultyBonus + streakBonus + challengeBonus;

        return {
          totalScore,
          basePoints,
          difficultyBonus,
          streakBonus,
          challengeBonus,
        };
      },
    }),
    {
      name: "atomic-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAtomicStore;
