// ========================================
// HABITS & GOALS SCREEN
// View and check-in habits, track goals
// ========================================

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import useAtomicStore from "../state/atomicStore";
import HabitCard from "../components/HabitCard";
import GoalCard from "../components/GoalCard";
import { cn } from "../utils/cn";
import { format } from "date-fns";

type Tab = "habits" | "goals";

export default function HabitsGoalsScreen() {
  const [selectedTab, setSelectedTab] = useState<Tab>("habits");

  const habits = useAtomicStore((s) => s.habits);
  const goals = useAtomicStore((s) => s.goals);
  const checkInHabit = useAtomicStore((s) => s.checkInHabit);
  const uncheckHabit = useAtomicStore((s) => s.uncheckHabit);
  const isHabitCheckedToday = useAtomicStore((s) => s.isHabitCheckedToday);
  const getHabitStreak = useAtomicStore((s) => s.getHabitStreak);
  const incrementGoalProgress = useAtomicStore((s) => s.incrementGoalProgress);

  const activeHabits = habits.filter((h) => h.isActive);
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const today = format(new Date(), "yyyy-MM-dd");

  const handleHabitCheck = (habitId: string) => {
    const isChecked = isHabitCheckedToday(habitId);
    if (isChecked) {
      uncheckHabit(habitId);
    } else {
      checkInHabit(habitId);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: 60 }}>
      {/* Header with Tab Selector */}
      <View className="px-4 pt-4 pb-4 bg-white border-b border-gray-100">
        <Text className="text-3xl font-bold text-gray-900 mb-4">
          {selectedTab === "habits" ? "My Habits" : "My Goals"}
        </Text>

        {/* Tab Selector */}
        <View className="bg-gray-100 rounded-xl p-1 flex-row">
          <Pressable
            onPress={() => setSelectedTab("habits")}
            className={cn(
              "flex-1 py-3 rounded-lg items-center justify-center",
              selectedTab === "habits" ? "bg-white shadow-sm" : ""
            )}
          >
            <Text
              className={cn(
                "text-sm font-semibold",
                selectedTab === "habits" ? "text-blue-600" : "text-gray-600"
              )}
            >
              Habits
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab("goals")}
            className={cn(
              "flex-1 py-3 rounded-lg items-center justify-center",
              selectedTab === "goals" ? "bg-white shadow-sm" : ""
            )}
          >
            <Text
              className={cn(
                "text-sm font-semibold",
                selectedTab === "goals" ? "text-blue-600" : "text-gray-600"
              )}
            >
              Goals
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 pt-4 pb-20">
        {selectedTab === "habits" ? (
          <>
            {/* Today's Date */}
            <Text className="text-sm text-gray-500 mb-3">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </Text>

            {/* Habits List */}
            {activeHabits.length > 0 ? (
              activeHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isChecked={isHabitCheckedToday(habit.id)}
                  streak={getHabitStreak(habit.id)}
                  onCheck={() => handleHabitCheck(habit.id)}
                />
              ))
            ) : (
              <View className="bg-white rounded-2xl p-8 items-center justify-center mt-8">
                <Text className="text-gray-400 text-center mb-2">
                  No habits yet
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  Tap the + tab to create your first habit
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-bold text-gray-900 mb-3">
                  Active Goals
                </Text>
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onIncrement={
                      goal.goalType === "action_based"
                        ? () => incrementGoalProgress(goal.id)
                        : undefined
                    }
                  />
                ))}
              </View>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <View>
                <Text className="text-base font-bold text-gray-900 mb-3">
                  Completed Goals
                </Text>
                {completedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </View>
            )}

            {/* Empty State */}
            {activeGoals.length === 0 && completedGoals.length === 0 && (
              <View className="bg-white rounded-2xl p-8 items-center justify-center mt-8">
                <Text className="text-gray-400 text-center mb-2">
                  No goals yet
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  Tap the + tab to create your first goal
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
