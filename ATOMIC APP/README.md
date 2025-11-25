# ATOMIC - Habit & Goal Tracking App 🔵

> **"Small steps, big results"**

ATOMIC is a beautiful habit-tracking app built with React Native + Expo, fully aligned with James Clear's "Atomic Habits" principles. **V2** introduces identity-based habits, systems thinking, intelligent streaks, habit stacking, and advanced coaching features.

---

## 🎯 Features

### V2 - Atomic Habits Principles (NEW!)

**Identity-Based Habits**
- Define who you want to become (Athlete, Writer, Entrepreneur, etc.)
- Link habits to identities for reinforcement
- Track progress per identity with visual scores
- "Every action is a vote for the type of person you wish to become"

**Systems Over Goals**
- Group habits into coherent systems (Health, Business, Mindset)
- Track system completion rates
- "You do not rise to the level of your goals. You fall to the level of your systems."

**The 4 Laws of Behavior Change**
1. **Make it Obvious**: Cues & triggers (time, location, context, habit stacking)
2. **Make it Attractive**: Identity reinforcement, temptation bundling
3. **Make it Easy**: Difficulty levels, environment design tips, 2-minute rule
4. **Make it Satisfying**: Advanced scoring, streak bonuses, micro-rewards

**Advanced Features**
- **Difficulty Levels**: Easy (0.1pts), Medium (0.15pts), Hard (0.2pts)
- **Intelligent Streaks**: Forgiveness logic (miss 1 day = warning, miss 2 = reset)
- **Habit Stacking**: "After I [X], I will [Y]" patterns
- **Cues & Triggers**: Time-based, location-based, context-based
- **Daily Journal**: Reflection, wins, blockers, mood tracking
- **Coaching Suggestions**: AI-powered recommendations based on patterns
- **Mini-Challenges**: Daily, weekly, monthly challenges with rewards
- **Strategy Library**: Educational content on the 4 Laws
- **Advanced Scoring**: Base points + difficulty bonus + streak bonus + challenge bonus

### Core V1 Functionality
- **Complete Onboarding Flow**: Welcome screen, signup, and interactive tutorial
- **Habit Tracking**: Create and track daily, weekly, or monthly habits
- **ATOMIC Points System**: Earn points for each habit check-in
- **Streak Tracking**: Monitor current and best streaks for motivation
- **Badge System**: Unlock achievements as you build consistency
- **Beautiful Dashboard**: Visualize your progress with charts and stats
- **Account Management**: Disconnect and create new accounts

### App Structure
The app has **4 main tabs** (after onboarding):
1. **Dashboard** - Overview with stats, identity/system scores, coaching suggestions
2. **Habits & Goals** - Daily checklist with difficulty, identities, and systems
3. **Add** - Create new habits with V2 features (difficulty, identities, cues, stacking)
4. **Profile** - User profile, badges, journal, strategies, challenges

---

## 📊 How It Works

### ATOMIC Points System V2
- **Easy habits** = **0.1 points** per check-in
- **Medium habits** = **0.15 points** per check-in
- **Hard habits** = **0.2 points** per check-in
- **Streak Bonus**: 0.05 points per 7-day streak
- **Challenge Bonus**: 1 point per completed challenge
- **Total Score** = Base Points + Difficulty Bonus + Streak Bonus + Challenge Bonus

### Intelligent Streaks with Forgiveness
- **Miss 1 day**: Get a warning, streak continues (forgiveness used)
- **Miss 2 consecutive days**: Streak resets to 0
- Encourages consistency while being forgiving of life's interruptions

### Identity-Based Habits
Link each habit to one or more identities:
- "I am an **Athlete**" → Link: Morning Run, Gym Session, Protein Shake
- Track total points and completion rate per identity
- Visual dashboard showing identity progress

### Systems Thinking
Group habits into systems for holistic tracking:
- **Health System**: Exercise, Meal Prep, Sleep Early (Target: 80% completion)
- **Business System**: Deep Work, Networking, Learning (Target: 70% completion)
- Monitor system health and adjust as needed

### Habit Stacking
Build new habits by stacking them after existing ones:
- "After I **pour my morning coffee**, I will **meditate for 5 minutes**"
- App tracks stacks and shows progression
- Makes new habits easier by anchoring to established routines

### Cues & Triggers (Make it Obvious)
Add multiple cues to each habit:
- **Time**: "Every day at 7:00 AM"
- **Location**: "When I arrive at the gym"
- **Context**: "After I wake up"
- **Habit Stacking**: "After I finish breakfast"

### Daily Journal
Reflect on your day:
- Free-form journaling
- Highlight one win
- Note one blocker to improve
- Rate your mood (1-5)
- Link to habits and identities for context

### Coaching Suggestions
Intelligent recommendations based on your patterns:
- **Reduce Difficulty**: Struggling with a hard habit? Make it easier
- **Add Cues**: Missing habits? Add a trigger
- **Habit Stack**: Leverage existing habits
- **Environmental Design**: Optimize your surroundings
- Dismiss suggestions when not relevant

### Mini-Challenges
- **Daily**: Complete 1 habit today
- **Weekly**: 7-day streak, complete hard habit 5x
- **Monthly**: System mastery at 80%+ for 30 days
- Earn badges and bonus points for completing challenges

### Strategy Library
Educational content organized by the 4 Laws:
1. **Make it Obvious**: Implementation intentions, habit stacking, environment design
2. **Make it Attractive**: Temptation bundling, join a culture, create a motivation ritual
3. **Make it Easy**: 2-minute rule, reduce friction, prepare environment
4. **Make it Satisfying**: Habit tracking, reward yourself, never miss twice

---

## 🏗️ Project Structure

```
/home/user/workspace/
├── src/
│   ├── types/
│   │   ├── atomic.ts                 # V1 data models (extended with V2 fields)
│   │   └── atomicV2.ts               # V2 new models (Identity, System, Cue, etc.)
│   ├── state/
│   │   └── atomicStore.ts            # Zustand store with V2 state and actions
│   ├── components/
│   │   ├── HabitCard.tsx             # Habit checklist item
│   │   ├── GoalCard.tsx              # Goal progress card
│   │   ├── BadgeCard.tsx             # Badge display
│   │   ├── StatCard.tsx              # Statistic card
│   │   ├── PeriodFilter.tsx          # Day/Week/Month/Year selector
│   │   └── SimpleBarChart.tsx        # Minimal bar chart
│   ├── screens/
│   │   ├── WelcomeScreen.tsx         # First-time welcome screen
│   │   ├── SignupScreen.tsx          # Account creation
│   │   ├── TutorialScreen.tsx        # Interactive onboarding tutorial
│   │   ├── DashboardScreen.tsx       # Main dashboard
│   │   ├── HabitsGoalsScreen.tsx     # Habits & goals list
│   │   ├── AddScreen.tsx             # Create habits with V2 features
│   │   └── ProfileScreen.tsx         # User profile, badges & disconnect
│   └── navigation/
│       └── RootNavigator.tsx         # Bottom tab navigation
├── App.tsx                           # App entry point with auth flow
├── tailwind.config.js                # Custom ATOMIC colors
└── package.json                      # Dependencies
```

---

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#3B82F6` - Main brand color, buttons, accents
- **White**: `#FFFFFF` - Background, cards
- **Dark Blue**: `#1E3A8A` - Text, titles
- **Light Gray**: `#F3F4F6` - Separators, subtle backgrounds

**Additional Accent Colors**:
- Cyan: `#06B6D4`
- Light Blue: `#0EA5E9`
- Indigo: `#6366F1`

### Visual Style
- **Minimal & Clean**: Generous white space, simple layouts
- **Rounded Corners**: Cards use `rounded-2xl` (16px) or `rounded-3xl` (24px)
- **Subtle Shadows**: Light shadows for depth without heaviness
- **Icons**: Ionicons with outline style for consistency
- **Charts**: Simple bar charts with minimal text

### Typography
- **Headings**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Labels**: Semi-bold, 12-14px

---

## 💾 Data Storage

The app uses **Zustand** with **AsyncStorage** for local persistence.

### Data Models

**Habit (Extended for V2)**
```typescript
{
  id: string
  userId: string
  title: string
  description?: string
  type: "daily" | "weekly" | "monthly"
  category: HabitCategory
  color: string
  iconName: string
  isActive: boolean
  createdAt: string

  // V2 Extensions
  difficulty?: "easy" | "medium" | "hard"
  linkedIdentityIds?: string[]  // Identities this habit reinforces
  systemId?: string              // System this habit belongs to
  environmentTips?: string       // Environment design tips
  enableHabitStacking?: boolean
  stackedAfterHabitId?: string
}
```

**Identity (V2)**
```typescript
{
  id: string
  userId: string
  name: string          // "Athlete", "Writer", etc.
  description?: string
  color: string
  iconName: string
  isActive: boolean
  createdAt: string
}
```

**System (V2)**
```typescript
{
  id: string
  userId: string
  name: string                 // "Health", "Business"
  description?: string
  color: string
  iconName: string
  habitIds: string[]
  targetCompletionRate?: number  // 0-100%
  createdAt: string
}
```

**Streak (V2 - Intelligent with Forgiveness)**
```typescript
{
  id: string
  userId: string
  habitId: string
  currentStreakCount: number
  bestStreakCount: number
  lastCheckinDate: string
  missedConsecutiveDays: number
  forgivenessUsed: boolean
  updatedAt: string
}
```

**Challenge (V2)**
```typescript
{
  id: string
  userId?: string
  name: string
  description: string
  type: "daily" | "weekly" | "monthly"
  startDate: string
  endDate: string
  targetValue: number
  currentValue: number
  status: "active" | "completed" | "failed" | "upcoming"
  createdAt: string
}
```

**JournalEntry (V2)**
```typescript
{
  id: string
  userId: string
  date: string  // YYYY-MM-DD
  content?: string
  highlightWin?: string
  highlightBlocker?: string
  mood?: number  // 1-5
  linkedHabitIds?: string[]
  linkedIdentityIds?: string[]
  createdAt: string
}
```

**Cue (V2 - Make it Obvious)**
```typescript
{
  id: string
  habitId: string
  userId: string
  type: "time" | "location" | "context" | "after_habit"
  timeOfDay?: string
  location?: string
  contextDescription?: string
  afterHabitId?: string
  enabled: boolean
  createdAt: string
}
```

**HabitStack (V2)**
```typescript
{
  id: string
  userId: string
  baseHabitId: string
  stackedHabitId: string
  descriptionPattern: string  // "After I [X], I will [Y]"
  isActive: boolean
  createdAt: string
}
```

---

## 🔧 Key Functions (Zustand Store)

### V2 Identity Actions
- `addIdentity(identity)` - Create new identity
- `updateIdentity(identityId, updates)` - Modify identity
- `deleteIdentity(identityId)` - Remove identity
- `getIdentityScore(identityId)` - Get points, habit count, completion rate

### V2 System Actions
- `addSystem(system)` - Create new system
- `updateSystem(systemId, updates)` - Modify system
- `deleteSystem(systemId)` - Remove system
- `getSystemScore(systemId)` - Get system metrics

### V2 Streak Actions (Intelligent)
- `updateStreaks()` - Update all habit streaks with forgiveness logic
- `getHabitStreakV2(habitId)` - Get streak with forgiveness info

### V2 Journal Actions
- `addJournalEntry(entry)` - Create daily journal
- `updateJournalEntry(entryId, updates)` - Edit journal
- `getJournalEntry(date)` - Get entry for specific date

### V2 Challenge Actions
- `addChallenge(challenge)` - Create challenge
- `updateChallengeProgress()` - Auto-update challenge progress
- `deleteChallenge(challengeId)` - Remove challenge

### V2 Cue Actions
- `addCue(cue)` - Add trigger to habit
- `updateCue(cueId, updates)` - Modify cue
- `deleteCue(cueId)` - Remove cue

### V2 Habit Stack Actions
- `addHabitStack(stack)` - Create habit stack
- `updateHabitStack(stackId, updates)` - Modify stack
- `deleteHabitStack(stackId)` - Remove stack

### V2 Coaching Actions
- `generateCoachingSuggestions()` - AI-powered recommendations
- `dismissSuggestion(suggestionId)` - Remove suggestion

### V2 Computed Values
- `getAtomicScoreV2()` - Score with difficulty multipliers
- `getAdvancedAtomicScore()` - Detailed breakdown (base, difficulty, streak, challenge bonuses)

### V1 User Actions
- `createAccount(name, email, password)` - Create new account and initialize data
- `initializeUser()` - Creates default user and badges (legacy, use createAccount)
- `updateUser(updates)` - Update user profile
- `logout()` - Clear all data and return to welcome screen
- `completeOnboarding()` - Mark onboarding as complete
- `completeTutorial()` - Mark tutorial as seen

### Habit Actions
- `addHabit(habit)` - Create new habit
- `updateHabit(habitId, updates)` - Modify habit
- `deleteHabit(habitId)` - Remove habit and related data
- `checkInHabit(habitId, date?)` - Mark habit as complete (adds 0.1 points)
- `uncheckHabit(habitId, date?)` - Uncheck habit
- `isHabitCheckedToday(habitId)` - Check if habit is completed today

### Goal Actions
- `addGoal(goal)` - Create new goal
- `updateGoal(goalId, updates)` - Modify goal
- `deleteGoal(goalId)` - Remove goal
- `incrementGoalProgress(goalId)` - Add +1 to action-based goals

### Badge Actions
- `checkAndUnlockBadges()` - Auto-check and unlock badges (called after actions)

### Computed Values
- `getTotalAtomicPoints()` - Sum of all check-in points
- `getCurrentStreak()` - Consecutive days with at least 1 check-in
- `getBestStreak()` - Longest streak ever achieved
- `getHabitStreak(habitId)` - Current and best streak for specific habit
- `getCheckinsForPeriod(start, end)` - Filter check-ins by date range
- `getPointsForPeriod(start, end)` - Sum points for date range

---

## 🎯 Usage Examples

### Creating a Habit
1. Go to **Add** tab
2. Enter title (e.g., "Morning Exercise")
3. Select frequency (Daily/Weekly/Monthly)
4. Choose category (e.g., Fitness)
5. Pick an icon and color
6. Tap "Create Habit"

### Checking In a Habit
1. Go to **Habits & Goals** tab
2. Tap the checkbox next to a habit
3. Habit is marked complete for today
4. You earn **0.1 ATOMIC points**
5. Your streak increases by 1

### Creating a Goal
1. Go to **Add** tab → **Goal** tab
2. Enter title (e.g., "Exercise 7 days this week")
3. Select period (Weekly/Monthly)
4. Choose goal type:
   - **Habit-based**: Select habits to track
   - **Action-based**: Set manual target (e.g., 10 actions)
5. Set target value
6. Tap "Create Goal"

### Unlocking Badges
Badges unlock automatically when you meet conditions:
- Complete your first habit → "First Step" badge
- 7-day streak → "Consistency 7" badge
- 100 ATOMIC points → "Atomic 100" badge
- Complete 5 goals → "Goal Crusher" badge

---

## 🚀 Customization Guide

### Adding New Colors
Edit `/tailwind.config.js`:
```javascript
colors: {
  atomic: {
    blue: "#3B82F6",
    newcolor: "#YOUR_HEX",
  },
}
```

### Adding New Badge Templates
Edit `/src/types/atomic.ts` in `BADGE_TEMPLATES` array:
```typescript
{
  name: "Badge Name",
  description: "How to unlock this badge",
  iconName: "icon-name",
  conditionType: "streak" | "total_points" | ...,
  conditionValue: 50,
}
```

### Adding New Habit Icons
Edit `/src/types/atomic.ts` in `HABIT_ICONS` array:
```typescript
export const HABIT_ICONS = [
  "fitness",
  "your-new-icon", // Must be valid Ionicons name
  ...
];
```

### Changing Point Values
Edit `/src/state/atomicStore.ts` in `checkInHabit` function:
```typescript
atomicPoints: 0.1,  // Change this value
```

---

## 📱 Navigation Structure

```
Bottom Tab Navigator (4 tabs)
├── Dashboard (Home icon)
│   └── DashboardScreen
├── Habits & Goals (Checkmark icon)
│   └── HabitsGoalsScreen
├── Add (Plus icon)
│   └── AddScreen
└── Profile (Person icon)
    └── ProfileScreen
```

---

## 🎨 Logo & Branding

**App Name**: ATOMIC

**Logo**: Blue pixel art Saturn planet 🪐

**Tagline**: "Small steps, big results"

**Philosophy**: Building atomic habits - small, consistent actions that compound over time to create massive results.

---

## 🔮 Future Enhancement Ideas

- **Reminders**: Push notifications for habit reminders
- **Analytics**: More detailed charts and insights
- **Social**: Share progress with friends
- **Custom Themes**: Dark mode, different color schemes
- **Export Data**: CSV export for external analysis
- **Habit Templates**: Pre-made popular habits
- **Calendar View**: Month calendar with check-in visualization
- **Notes**: Add notes to daily check-ins
- **Photo Progress**: Attach photos to track visual progress

---

## 📝 Notes for Developers

### Important Files
- **atomicStore.ts**: All business logic and state management
- **atomic.ts**: Type definitions and constants
- **RootNavigator.tsx**: Navigation configuration

### Key Patterns
- **Zustand selectors**: Always use selectors to prevent re-renders
  ```typescript
  const user = useAtomicStore((s) => s.user);  // ✅ Good
  const store = useAtomicStore();  // ❌ Causes re-renders
  ```

- **Date formatting**: All dates stored as `yyyy-MM-dd` strings for consistency
- **No duplicate check-ins**: System prevents multiple check-ins per habit per day
- **Auto-calculated fields**: `isCompleted`, `currentValue` auto-update based on check-ins

### Testing Scenarios
1. **First Launch**: User and badges initialize automatically
2. **Check-in**: Points add up, streaks increment
3. **Uncheck**: Points decrease, goal progress decrements
4. **Goal Completion**: Auto-marks as complete when target reached
5. **Badge Unlock**: Badges unlock immediately when conditions met

---

## 📊 V2 Implementation Status

### ✅ Completed (Backend/Data Layer)
- **Type Definitions**: All V2 models defined in `atomicV2.ts`
- **Zustand Store**: Complete V2 state and actions implemented
- **Data Models Extended**: Habit interface extended with V2 fields
- **Business Logic**:
  - Identity scoring system
  - System completion tracking
  - Intelligent streak forgiveness logic
  - Advanced atomic score calculation
  - Coaching suggestion generation
  - Challenge progress tracking
  - Cue and habit stack management
  - Journal entry system

### 🚧 In Progress (UI Layer)
The following screens and components need to be created to expose V2 features:

**Priority 1 - Core V2 Features:**
1. Update **AddScreen** to include:
   - Difficulty selector (easy/medium/hard)
   - Identity multi-selector
   - System dropdown
   - Environment tips field
   - Cue configuration (time, location, context)
   - Habit stacking setup

2. Update **DashboardScreen** to show:
   - Identity progress cards
   - System completion rates
   - Advanced atomic score breakdown
   - Coaching suggestions panel
   - Active challenges

3. Update **HabitsGoalsScreen** to display:
   - Habit difficulty badges
   - Linked identities icons
   - System tags
   - Forgiveness warnings on streaks

**Priority 2 - New Screens:**
4. **IdentitiesScreen** - Manage identities (CRUD)
5. **SystemsScreen** - Manage systems and assign habits
6. **JournalScreen** - Daily reflection interface
7. **ChallengesScreen** - View and track challenges
8. **StrategiesScreen** - Educational content library

**Priority 3 - Advanced Features:**
9. Cue notifications (time-based triggers)
10. Habit stacking notifications
11. Visual streak forgiveness indicators
12. Identity/System analytics charts

### 📦 What's Ready to Use
All V2 backend functionality is **fully implemented and ready**. You can:
- Call any V2 Zustand action from components
- Access all V2 computed values
- Store all V2 data (persisted via AsyncStorage)
- The app won't break - V2 fields are all optional

### 🎯 Next Steps for Full V2 Launch
1. Update existing screens to use V2 features
2. Create new V2-specific screens
3. Add visual indicators for V2 data
4. Test all V2 flows end-to-end
5. Update tutorial to explain V2 features

---

## 🎓 Learn More

This app demonstrates:
- React Native + Expo SDK 53
- Zustand state management with persistence
- Bottom tab navigation
- NativeWind (TailwindCSS for React Native)
- date-fns for date manipulation
- AsyncStorage for local data persistence
- Type-safe TypeScript patterns
- **NEW**: Identity-based habits (Atomic Habits principles)
- **NEW**: Systems thinking for habit organization
- **NEW**: Intelligent streak forgiveness
- **NEW**: Advanced habit scoring with multipliers

---

## 📄 License

Built with ❤️ for Vibecode

---

**Remember**: Progress is built one atomic habit at a time. Keep showing up! 🔵
