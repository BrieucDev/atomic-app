// ========================================
// PROFILE SCREEN
// User profile, stats, and badges
// ========================================

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import useAtomicStore from "../state/atomicStore";
import BadgeCard from "../components/BadgeCard";
import StatCard from "../components/StatCard";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");

  const user = useAtomicStore((s) => s.user);
  const updateUser = useAtomicStore((s) => s.updateUser);
  const logout = useAtomicStore((s) => s.logout);
  const habits = useAtomicStore((s) => s.habits);
  const goals = useAtomicStore((s) => s.goals);
  const badges = useAtomicStore((s) => s.badges);
  const getTotalAtomicPoints = useAtomicStore((s) => s.getTotalAtomicPoints);
  const getBestStreak = useAtomicStore((s) => s.getBestStreak);

  const totalPoints = getTotalAtomicPoints();
  const bestStreak = getBestStreak();
  const completedGoals = goals.filter((g) => g.isCompleted).length;
  const totalHabits = habits.length;

  const obtainedBadges = badges.filter((b) => b.obtainedAt !== null);
  const lockedBadges = badges.filter((b) => b.obtainedAt === null);

  const handleEditName = () => {
    if (isEditingName) {
      if (nameInput.trim()) {
        updateUser({ name: nameInput.trim() });
      }
      setIsEditingName(false);
    } else {
      setNameInput(user?.name || "");
      setIsEditingName(true);
    }
  };

  const handleEditBio = () => {
    if (isEditingBio) {
      updateUser({ bio: bioInput.trim() || "Building better habits, one day at a time" });
      setIsEditingBio(false);
    } else {
      setBioInput(user?.bio || "");
      setIsEditingBio(true);
    }
  };

  const handleChangeProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant permission to access your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateUser({ profilePictureUrl: result.assets[0].uri });
    }
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Disconnect Account",
      "Are you sure you want to disconnect? All your data will be cleared.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: 60 }}>
      <ScrollView className="flex-1">
        <View className="px-4 pt-4 pb-20">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-6">Profile</Text>

        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
          {/* Profile Picture */}
          <Pressable
            onPress={handleChangeProfilePicture}
            className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center self-center mb-4 border-4 border-blue-500"
          >
            {user?.profilePictureUrl ? (
              <View className="w-full h-full rounded-full overflow-hidden">
                <Text className="text-center text-blue-600 text-xs mt-9">
                  Tap to change
                </Text>
              </View>
            ) : (
              <Ionicons name="person" size={48} color="#3B82F6" />
            )}
          </Pressable>

          {/* Name */}
          <View className="mb-3">
            {isEditingName ? (
              <View className="flex-row items-center space-x-2">
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  className="flex-1 text-center text-2xl font-bold text-gray-900 bg-gray-50 rounded-xl px-3 py-2"
                  autoFocus
                />
                <Pressable onPress={handleEditName}>
                  <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleEditName} className="flex-row items-center justify-center space-x-2">
                <Text className="text-2xl font-bold text-gray-900">
                  {user?.name || "User"}
                </Text>
                <Ionicons name="pencil" size={18} color="#6B7280" />
              </Pressable>
            )}
          </View>

          {/* Bio */}
          <View>
            {isEditingBio ? (
              <View className="flex-row items-center space-x-2">
                <TextInput
                  value={bioInput}
                  onChangeText={setBioInput}
                  className="flex-1 text-center text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2"
                  autoFocus
                  multiline
                />
                <Pressable onPress={handleEditBio}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleEditBio} className="flex-row items-center justify-center space-x-2">
                <Text className="text-sm text-gray-600 text-center">
                  {user?.bio || "Building better habits, one day at a time"}
                </Text>
                <Ionicons name="pencil" size={14} color="#6B7280" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Global Stats */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
            Statistics
          </Text>
          <View className="flex-row space-x-3 mb-3">
            <StatCard
              icon="planet"
              label="ATOMIC Points"
              value={totalPoints.toFixed(1)}
              color="#3B82F6"
            />
            <StatCard
              icon="trophy"
              label="Best Streak"
              value={bestStreak}
              color="#F59E0B"
            />
          </View>
          <View className="flex-row space-x-3">
            <StatCard
              icon="checkmark-circle"
              label="Habits Created"
              value={totalHabits}
              color="#10B981"
            />
            <StatCard
              icon="flag"
              label="Goals Completed"
              value={completedGoals}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* V2 Features Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
            ATOMIC Features
          </Text>
          <View className="space-y-3">
            {/* Identities */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Identities" as never);
              }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center space-x-3">
                <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center">
                  <Ionicons name="person-outline" size={24} color="#8B5CF6" />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">
                    Identities
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Who you want to become
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>

            {/* Systems */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Systems" as never);
              }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center space-x-3">
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="grid-outline" size={24} color="#3B82F6" />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">
                    Systems
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Group your habits
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Badges Section */}
        <View>
          <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
            Badges
          </Text>

          {/* Obtained Badges */}
          {obtainedBadges.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-3 px-1">
                Unlocked ({obtainedBadges.length})
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {obtainedBadges.map((badge) => (
                  <View key={badge.id} className="w-[48%]">
                    <BadgeCard badge={badge} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-3 px-1">
                Locked ({lockedBadges.length})
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {lockedBadges.map((badge) => (
                  <View key={badge.id} className="w-[48%]">
                    <BadgeCard badge={badge} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Disconnect Button */}
      <View className="px-4 mb-6">
        <Pressable
          onPress={handleLogout}
          className="bg-red-500 rounded-2xl py-4 items-center shadow-sm active:opacity-80"
        >
          <View className="flex-row items-center space-x-2">
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Disconnect Account
            </Text>
          </View>
        </Pressable>
      </View>
      </ScrollView>
    </View>
  );
}
