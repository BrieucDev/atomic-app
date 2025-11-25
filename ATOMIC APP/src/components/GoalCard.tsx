// ========================================
// GOAL CARD COMPONENT
// Displays a goal with progress bar
// ========================================

import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Goal } from "../types/atomic";

interface GoalCardProps {
  goal: Goal;
  onIncrement?: () => void;
}

export default function GoalCard({ goal, onIncrement }: GoalCardProps) {
  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {goal.title}
          </Text>
          <Text className="text-xs text-gray-500 mt-1 capitalize">
            {goal.period} • {goal.goalType === "habit_based" ? "Habit-based" : "Action-based"}
          </Text>
        </View>

        {/* Completed badge */}
        {goal.isCompleted && (
          <View className="bg-green-100 rounded-full px-3 py-1">
            <Text className="text-xs font-semibold text-green-700">
              Completed
            </Text>
          </View>
        )}
      </View>

      {/* Progress */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-gray-700">
            {goal.currentValue} / {goal.targetValue}
          </Text>
          <Text className="text-sm font-medium text-blue-600">
            {Math.round(progress)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Action Button (for action-based goals) */}
      {goal.goalType === "action_based" && !goal.isCompleted && onIncrement && (
        <Pressable
          onPress={onIncrement}
          className="bg-blue-500 rounded-xl py-2 px-4 flex-row items-center justify-center"
        >
          <Ionicons name="add-circle-outline" size={18} color="white" />
          <Text className="text-white font-semibold ml-2 text-sm">
            Add Progress (+1)
          </Text>
        </Pressable>
      )}
    </View>
  );
}
