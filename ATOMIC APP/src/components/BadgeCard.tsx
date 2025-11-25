// ========================================
// BADGE CARD COMPONENT
// Displays a badge (obtained or locked)
// ========================================

import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "../types/atomic";

interface BadgeCardProps {
  badge: Badge;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  const isObtained = badge.obtainedAt !== null;

  return (
    <View className="bg-white rounded-2xl p-4 items-center border border-gray-100 shadow-sm">
      {/* Badge Icon */}
      <View
        className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
          isObtained ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        <Ionicons
          name={badge.iconName as any}
          size={32}
          color={isObtained ? "#3B82F6" : "#9CA3AF"}
        />
        {!isObtained && (
          <View className="absolute">
            <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Badge Name */}
      <Text
        className={`text-sm font-semibold text-center mb-1 ${
          isObtained ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {badge.name}
      </Text>

      {/* Badge Description */}
      <Text
        className={`text-xs text-center ${
          isObtained ? "text-gray-600" : "text-gray-400"
        }`}
      >
        {badge.description}
      </Text>
    </View>
  );
}
