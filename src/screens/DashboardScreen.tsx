// ========================================
// DASHBOARD SCREEN
// Main overview with stats, charts, and streaks
// ========================================

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAtomicStore from "../state/atomicStore";
import { DashboardPeriod, ChartDataPoint } from "../types/atomic";
import PeriodFilter from "../components/PeriodFilter";
import StatCard from "../components/StatCard";
import SimpleBarChart from "../components/SimpleBarChart";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  parseISO,
} from "date-fns";

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>("week");

  const user = useAtomicStore((s) => s.user);
  const habits = useAtomicStore((s) => s.habits);
  const getTotalAtomicPoints = useAtomicStore((s) => s.getTotalAtomicPoints);
  const getCurrentStreak = useAtomicStore((s) => s.getCurrentStreak);
  const getBestStreak = useAtomicStore((s) => s.getBestStreak);
  const getCheckinsForPeriod = useAtomicStore((s) => s.getCheckinsForPeriod);
  const getHabitStreak = useAtomicStore((s) => s.getHabitStreak);

  const totalPoints = getTotalAtomicPoints();
  const currentStreak = getCurrentStreak();
  const bestStreak = getBestStreak();
  const activeHabits = habits.filter((h) => h.isActive);

  // Calculate period dates
  const getPeriodDates = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "day":
        return {
          start: format(startOfDay(now), "yyyy-MM-dd"),
          end: format(endOfDay(now), "yyyy-MM-dd"),
        };
      case "week":
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "month":
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "year":
        return {
          start: format(startOfYear(now), "yyyy-MM-dd"),
          end: format(endOfYear(now), "yyyy-MM-dd"),
        };
    }
  };

  const { start, end } = getPeriodDates();
  const periodCheckins = getCheckinsForPeriod(start, end);
  const periodPoints = periodCheckins.reduce((sum, c) => sum + c.atomicPoints, 0);

  // Generate chart data
  const getChartData = (): ChartDataPoint[] => {
    const now = new Date();

    switch (selectedPeriod) {
      case "day": {
        // Show hours or habits for the day
        return activeHabits.slice(0, 10).map((habit) => {
          const checkins = periodCheckins.filter((c) => c.habitId === habit.id);
          return {
            label: habit.title.substring(0, 3),
            value: checkins.length > 0 ? 0.1 : 0,
          };
        });
      }

      case "week": {
        // Show 7 days (Mon-Sun)
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayCheckins = periodCheckins.filter((c) => c.date === dateKey);
          const dayPoints = dayCheckins.reduce((sum, c) => sum + c.atomicPoints, 0);

          return {
            label: format(day, "EEE"),
            value: dayPoints,
            date: dateKey,
          };
        });
      }

      case "month": {
        // Show days of month (grouped by week or showing all)
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Show every 5th day or so for readability
        const sampledDays = days.filter((_, i) => i % 5 === 0 || i === days.length - 1);

        return sampledDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayCheckins = periodCheckins.filter((c) => c.date === dateKey);
          const dayPoints = dayCheckins.reduce((sum, c) => sum + c.atomicPoints, 0);

          return {
            label: format(day, "d"),
            value: dayPoints,
            date: dateKey,
          };
        });
      }

      case "year": {
        // Show 12 months
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

        return months.map((month) => {
          const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
          const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");
          const monthCheckins = getCheckinsForPeriod(monthStart, monthEnd);
          const monthPoints = monthCheckins.reduce((sum, c) => sum + c.atomicPoints, 0);

          return {
            label: format(month, "MMM"),
            value: monthPoints,
          };
        });
      }
    }
  };

  const chartData = getChartData();

  // Top habits (by streak)
  const topHabits = activeHabits
    .map((habit) => ({
      ...habit,
      streak: getHabitStreak(habit.id),
    }))
    .sort((a, b) => b.streak.current - a.streak.current)
    .slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: 60 }}>
      <ScrollView className="flex-1">
        <View className="px-4 pt-4 pb-20">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-1">
            Hello, {user?.name || "User"}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="planet" size={16} color="#3B82F6" />
            <Text className="text-base text-gray-800 ml-2 font-medium">
              Small steps, big results
            </Text>
          </View>
        </View>

        {/* ATOMIC Score Card */}
        <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 mb-6 shadow-lg">
          <View className="flex-row items-center mb-2">
            <Ionicons name="planet-outline" size={24} color="#111827" />
            <Text className="text-gray-900 text-lg font-semibold ml-2">
              ATOMIC Score
            </Text>
          </View>
          <Text className="text-gray-900 text-5xl font-bold mb-1">
            {totalPoints.toFixed(1)}
          </Text>
          <Text className="text-gray-900 text-sm font-medium opacity-90">Total Points</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row space-x-3 mb-6">
          <StatCard
            icon="flame"
            label="Current Streak"
            value={currentStreak}
            color="#F59E0B"
          />
          <StatCard
            icon="trophy"
            label="Best Streak"
            value={bestStreak}
            color="#10B981"
          />
        </View>

        {/* Period Filter */}
        <View className="mb-4">
          <PeriodFilter selected={selectedPeriod} onSelect={setSelectedPeriod} />
        </View>

        {/* Period Stats */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Summary
          </Text>
          <View className="flex-row space-x-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-blue-600">
                {periodPoints.toFixed(1)}
              </Text>
              <Text className="text-sm text-gray-700 font-medium">Points earned</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-blue-600">
                {periodCheckins.length}
              </Text>
              <Text className="text-sm text-gray-700 font-medium">Check-ins</Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
            Activity
          </Text>
          <SimpleBarChart data={chartData} color="#3B82F6" />
        </View>

        {/* Top Habits */}
        {topHabits.length > 0 && (
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
              Top Habits
            </Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {topHabits.map((habit, index) => (
                <View
                  key={habit.id}
                  className={`flex-row items-center py-3 ${
                    index < topHabits.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: habit.color + "20" }}
                  >
                    <Ionicons
                      name={habit.iconName as any}
                      size={20}
                      color={habit.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {habit.title}
                    </Text>
                    <Text className="text-xs text-gray-700 font-medium">
                      {habit.streak.current} day streak
                    </Text>
                  </View>
                  {index === 0 && habit.streak.current > 0 && (
                    <Ionicons name="medal" size={24} color="#F59E0B" />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
}
