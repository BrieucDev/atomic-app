// ========================================
// PERIOD FILTER COMPONENT
// Segmented control for day/week/month/year
// ========================================

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { DashboardPeriod } from "../types/atomic";

interface PeriodFilterProps {
  selected: DashboardPeriod;
  onSelect: (period: DashboardPeriod) => void;
}

const periods: { value: DashboardPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function PeriodFilter({ selected, onSelect }: PeriodFilterProps) {
  return (
    <View style={styles.container}>
      {periods.map((period) => (
        <Pressable
          key={period.value}
          onPress={() => onSelect(period.value)}
          style={[
            styles.button,
            selected === period.value && styles.buttonSelected
          ]}
        >
          <Text
            style={[
              styles.text,
              selected === period.value ? styles.textSelected : styles.textUnselected
            ]}
          >
            {period.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    flexDirection: "row",
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSelected: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  textSelected: {
    color: "#3B82F6",
  },
  textUnselected: {
    color: "#6B7280",
  },
});
