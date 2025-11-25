// ========================================
// STAT CARD COMPONENT
// Displays a statistic with icon
// ========================================

import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ icon, label, value, color = "#3B82F6" }: StatCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 flex-1 shadow-sm border border-gray-100">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: color + "20" }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
