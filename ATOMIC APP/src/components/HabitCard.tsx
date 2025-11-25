// ========================================
// HABIT CARD COMPONENT
// Displays a habit with check-in button
// ========================================

import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Habit } from "../types/atomic";
import { cn } from "../utils/cn";

interface HabitCardProps {
  habit: Habit;
  isChecked: boolean;
  streak: { current: number; best: number };
  onCheck: () => void;
}

export default function HabitCard({
  habit,
  isChecked,
  streak,
  onCheck,
}: HabitCardProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCheck();
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Icon + Info */}
        <View className="flex-row items-center flex-1">
          {/* Icon Circle */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: habit.color + "20" }}
          >
            <Ionicons name={habit.iconName as any} size={24} color={habit.color} />
          </View>

          {/* Habit Info */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {habit.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-gray-500 capitalize mr-3">
                {habit.type}
              </Text>
              {streak.current > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="flame" size={14} color="#F59E0B" />
                  <Text className="text-xs text-gray-500 ml-1">
                    {streak.current} days
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: Checkbox */}
        <View
          className={cn(
            "w-8 h-8 rounded-full border-2 items-center justify-center",
            isChecked ? "bg-blue-500 border-blue-500" : "border-gray-300"
          )}
        >
          {isChecked && <Ionicons name="checkmark" size={20} color="white" />}
        </View>
      </View>
    </Pressable>
  );
}
