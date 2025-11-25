// ========================================
// ADD SCREEN - V2 WITH ATOMIC HABITS FEATURES
// Create new habits with difficulty, identities, systems, cues
// ========================================

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import useAtomicStore from "../state/atomicStore";
import {
  HabitType,
  HabitCategory,
  HabitDifficulty,
  HABIT_COLORS,
  HABIT_ICONS,
} from "../types/atomic";
import { cn } from "../utils/cn";

export default function AddScreen() {
  const addHabit = useAtomicStore((s) => s.addHabit);
  const addIdentity = useAtomicStore((s) => s.addIdentity);
  const identities = useAtomicStore((s) => s.identities);
  const systems = useAtomicStore((s) => s.systems);

  // Habit form state
  const [habitTitle, setHabitTitle] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitType, setHabitType] = useState<HabitType>("daily");
  const [habitCategory, setHabitCategory] = useState<HabitCategory>("health");
  const [habitColor, setHabitColor] = useState(HABIT_COLORS[0]);
  const [habitIcon, setHabitIcon] = useState(HABIT_ICONS[0]);

  // V2 form state
  const [difficulty, setDifficulty] = useState<HabitDifficulty>("easy");
  const [selectedIdentityIds, setSelectedIdentityIds] = useState<string[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>(undefined);
  const [environmentTips, setEnvironmentTips] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetHabitForm = () => {
    setHabitTitle("");
    setHabitDescription("");
    setHabitType("daily");
    setHabitCategory("health");
    setHabitColor(HABIT_COLORS[0]);
    setHabitIcon(HABIT_ICONS[0]);
    setDifficulty("easy");
    setSelectedIdentityIds([]);
    setSelectedSystemId(undefined);
    setEnvironmentTips("");
    setShowAdvanced(false);
  };

  const toggleIdentity = (identityId: string) => {
    if (selectedIdentityIds.includes(identityId)) {
      setSelectedIdentityIds(selectedIdentityIds.filter((id) => id !== identityId));
    } else {
      setSelectedIdentityIds([...selectedIdentityIds, identityId]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateHabit = async () => {
    if (!habitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit title");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    addHabit({
      title: habitTitle.trim(),
      description: habitDescription.trim() || undefined,
      type: habitType,
      category: habitCategory,
      color: habitColor,
      iconName: habitIcon,
      // V2 fields
      difficulty,
      linkedIdentityIds: selectedIdentityIds.length > 0 ? selectedIdentityIds : undefined,
      systemId: selectedSystemId,
      environmentTips: environmentTips.trim() || undefined,
    });

    resetHabitForm();
    Alert.alert("Success", "Habit created successfully!");
  };

  const habitCategories: HabitCategory[] = [
    "health",
    "productivity",
    "studies",
    "finance",
    "personal",
    "fitness",
    "mindfulness",
    "social",
    "other",
  ];

  const difficultyInfo = {
    easy: { label: "Easy", points: "0.1", description: "Simple, takes 2 minutes", emoji: "🟢" },
    medium: { label: "Medium", points: "0.15", description: "Moderate effort", emoji: "🟡" },
    hard: { label: "Hard", points: "0.2", description: "Requires significant effort", emoji: "🔴" },
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: 60 }}>
      {/* Header */}
      <View style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
        <Text className="text-3xl font-bold text-gray-900">
          Create New Habit
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          Build atomic habits, one step at a time
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6 pb-20"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HABIT FORM */}
        <View>
          {/* Title */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Title *
            </Text>
            <TextInput
              value={habitTitle}
              onChangeText={setHabitTitle}
              placeholder="e.g., Drink water, Exercise, Read"
              className="bg-white rounded-xl px-4 py-3 text-base text-gray-900 border border-gray-200"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Description (optional)
            </Text>
            <TextInput
              value={habitDescription}
              onChangeText={setHabitDescription}
              placeholder="Add details about this habit"
              className="bg-white rounded-xl px-4 py-3 text-base text-gray-900 border border-gray-200"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Difficulty (V2) */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Difficulty (Make it Easy) ⚡
            </Text>
            <View className="space-y-2">
              {(["easy", "medium", "hard"] as HabitDifficulty[]).map((diff) => (
                <Pressable
                  key={diff}
                  onPress={() => {
                    setDifficulty(diff);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 flex-row items-center justify-between",
                    difficulty === diff
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200"
                  )}
                >
                  <View className="flex-row items-center space-x-3">
                    <Text className="text-2xl">{difficultyInfo[diff].emoji}</Text>
                    <View>
                      <Text
                        className={cn(
                          "text-base font-semibold",
                          difficulty === diff ? "text-blue-600" : "text-gray-900"
                        )}
                      >
                        {difficultyInfo[diff].label}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {difficultyInfo[diff].description}
                      </Text>
                    </View>
                  </View>
                  <Text className={cn(
                    "text-sm font-bold",
                    difficulty === diff ? "text-blue-600" : "text-gray-500"
                  )}>
                    {difficultyInfo[diff].points} pts
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Type */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Frequency
            </Text>
            <View className="flex-row space-x-2">
              {(["daily", "weekly", "monthly"] as HabitType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => {
                    setHabitType(type);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2",
                    habitType === type
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200"
                  )}
                >
                  <Text
                    className={cn(
                      "text-center text-sm font-semibold capitalize",
                      habitType === type ? "text-blue-600" : "text-gray-600"
                    )}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row space-x-2"
            >
              {habitCategories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setHabitCategory(cat);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full border-2",
                    habitCategory === cat
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-semibold capitalize",
                      habitCategory === cat ? "text-blue-600" : "text-gray-600"
                    )}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Identities (V2) */}
          {identities.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Link to Identities (optional) 👤
              </Text>
              <Text className="text-xs text-gray-500 mb-2">
                Who does this habit help you become?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {identities.map((identity) => (
                  <Pressable
                    key={identity.id}
                    onPress={() => toggleIdentity(identity.id)}
                    className={cn(
                      "px-3 py-2 rounded-full border-2 flex-row items-center space-x-1",
                      selectedIdentityIds.includes(identity.id)
                        ? "border-blue-500"
                        : "bg-white border-gray-200"
                    )}
                    style={{
                      backgroundColor: selectedIdentityIds.includes(identity.id)
                        ? identity.color + "20"
                        : "#FFFFFF",
                    }}
                  >
                    <Ionicons
                      name={identity.iconName as any}
                      size={16}
                      color={selectedIdentityIds.includes(identity.id) ? identity.color : "#6B7280"}
                    />
                    <Text
                      className={cn(
                        "text-sm font-semibold ml-1",
                        selectedIdentityIds.includes(identity.id) ? "text-gray-900" : "text-gray-600"
                      )}
                    >
                      {identity.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Systems (V2) */}
          {systems.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Add to System (optional) 🎯
              </Text>
              <Text className="text-xs text-gray-500 mb-2">
                Group habits into systems for better tracking
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => {
                    setSelectedSystemId(undefined);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-full border-2",
                    !selectedSystemId
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200"
                  )}
                >
                  <Text className={cn(
                    "text-sm font-semibold",
                    !selectedSystemId ? "text-blue-600" : "text-gray-600"
                  )}>
                    No System
                  </Text>
                </Pressable>
                {systems.map((system) => (
                  <Pressable
                    key={system.id}
                    onPress={() => {
                      setSelectedSystemId(system.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-full border-2 flex-row items-center space-x-1",
                      selectedSystemId === system.id
                        ? "border-blue-500"
                        : "bg-white border-gray-200"
                    )}
                    style={{
                      backgroundColor: selectedSystemId === system.id
                        ? system.color + "20"
                        : "#FFFFFF",
                    }}
                  >
                    <Ionicons
                      name={system.iconName as any}
                      size={16}
                      color={selectedSystemId === system.id ? system.color : "#6B7280"}
                    />
                    <Text
                      className={cn(
                        "text-sm font-semibold ml-1",
                        selectedSystemId === system.id ? "text-gray-900" : "text-gray-600"
                      )}
                    >
                      {system.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Advanced Section Toggle */}
          <Pressable
            onPress={() => {
              setShowAdvanced(!showAdvanced);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="mb-4 flex-row items-center justify-between p-3 bg-gray-100 rounded-xl"
          >
            <Text className="text-sm font-semibold text-gray-700">
              Advanced Options
            </Text>
            <Ionicons
              name={showAdvanced ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6B7280"
            />
          </Pressable>

          {/* Advanced Options */}
          {showAdvanced && (
            <View className="mb-4">
              {/* Environment Tips */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Environment Design Tips 🌟
                </Text>
                <Text className="text-xs text-gray-500 mb-2">
                  How will you prepare your environment? (Make it Easy)
                </Text>
                <TextInput
                  value={environmentTips}
                  onChangeText={setEnvironmentTips}
                  placeholder="e.g., Put running shoes by the door, prep workout clothes the night before"
                  className="bg-white rounded-xl px-4 py-3 text-base text-gray-900 border border-gray-200"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* Icon */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Icon
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {HABIT_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => {
                    setHabitIcon(icon);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "w-14 h-14 rounded-xl items-center justify-center border-2",
                    habitIcon === icon
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200"
                  )}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={habitIcon === icon ? "#3B82F6" : "#6B7280"}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Color
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {HABIT_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => {
                    setHabitColor(color);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "w-14 h-14 rounded-xl border-2",
                    habitColor === color ? "border-gray-900" : "border-gray-200"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
          </View>

          {/* Create Button */}
          <Pressable
            onPress={handleCreateHabit}
            className="bg-blue-500 rounded-2xl py-4 items-center justify-center shadow-sm mb-4"
          >
            <Text className="text-white text-base font-bold">
              Create Habit
            </Text>
          </Pressable>

          {/* Helper Text */}
          <Text className="text-xs text-center text-gray-500 mb-2">
            💡 Start with easy habits. You can always increase difficulty later.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
