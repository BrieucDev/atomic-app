// ========================================
// SIMPLE BAR CHART COMPONENT
// Minimal bar chart for displaying data
// ========================================

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { ChartDataPoint } from "../types/atomic";

interface SimpleBarChartProps {
  data: ChartDataPoint[];
  color?: string;
}

export default function SimpleBarChart({ data, color = "#3B82F6" }: SimpleBarChartProps) {
  if (data.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 items-center justify-center h-48">
        <Text className="text-gray-400">No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="bg-white rounded-2xl p-4"
    >
      <View className="flex-row items-end h-40 space-x-3">
        {data.map((point, index) => {
          const heightPercent = (point.value / maxValue) * 100;
          const minHeight = 8; // Minimum height for visibility
          const height = Math.max((heightPercent / 100) * 128, minHeight);

          return (
            <View key={index} className="items-center space-y-2">
              {/* Value on top */}
              {point.value > 0 && (
                <Text className="text-xs font-semibold text-gray-700 mb-1">
                  {point.value.toFixed(1)}
                </Text>
              )}

              {/* Bar */}
              <View
                className="w-10 rounded-t-lg"
                style={{
                  backgroundColor: color,
                  height,
                }}
              />

              {/* Label */}
              <Text className="text-xs text-gray-500 w-10 text-center">
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
