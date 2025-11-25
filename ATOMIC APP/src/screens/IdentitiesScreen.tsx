// ========================================
// IDENTITIES SCREEN - V2
// Manage identities (who you want to become)
// ========================================

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import useAtomicStore from "../state/atomicStore";
import { HABIT_COLORS, HABIT_ICONS } from "../types/atomic";
import { cn } from "../utils/cn";

export default function IdentitiesScreen() {
  const identities = useAtomicStore((s) => s.identities);
  const addIdentity = useAtomicStore((s) => s.addIdentity);
  const updateIdentity = useAtomicStore((s) => s.updateIdentity);
  const deleteIdentity = useAtomicStore((s) => s.deleteIdentity);
  const getIdentityScore = useAtomicStore((s) => s.getIdentityScore);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [iconName, setIconName] = useState(HABIT_ICONS[0]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(HABIT_COLORS[0]);
    setIconName(HABIT_ICONS[0]);
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an identity name");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (editingId) {
      updateIdentity(editingId, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        iconName,
      });
    } else {
      addIdentity({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        iconName,
        isActive: true,
      });
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (identity: any) => {
    setEditingId(identity.id);
    setName(identity.name);
    setDescription(identity.description || "");
    setColor(identity.color);
    setIconName(identity.iconName);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Identity",
      "This will remove the identity from all linked habits. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteIdentity(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: 60 }}>
      {/* Header */}
      <View
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <Text className="text-3xl font-bold text-gray-900">Identities</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Define who you want to become
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-20">
        {/* Info Card */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
          <View className="flex-row items-start space-x-3">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-blue-900 mb-1">
                Identity-Based Habits
              </Text>
              <Text className="text-xs text-blue-700">
                &ldquo;Every action is a vote for the type of person you wish to
                become.&rdquo; Link habits to identities to reinforce your self-image.
              </Text>
            </View>
          </View>
        </View>

        {/* Identities List */}
        {identities.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="person-add-outline" size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-400 mt-4">
              No identities yet
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-2 px-8">
              Create your first identity to start building atomic habits
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {identities.map((identity) => {
              const score = getIdentityScore(identity.id);
              return (
                <View
                  key={identity.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center space-x-3">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: identity.color + "20" }}
                      >
                        <Ionicons
                          name={identity.iconName as any}
                          size={24}
                          color={identity.color}
                        />
                      </View>
                      <View>
                        <Text className="text-lg font-bold text-gray-900">
                          {identity.name}
                        </Text>
                        {identity.description && (
                          <Text className="text-xs text-gray-500 mt-0.5">
                            {identity.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center space-x-2">
                      <Pressable
                        onPress={() => handleEdit(identity)}
                        className="w-8 h-8 items-center justify-center"
                      >
                        <Ionicons name="create-outline" size={20} color="#6B7280" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(identity.id)}
                        className="w-8 h-8 items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Stats */}
                  <View className="flex-row space-x-4 pt-3 border-t border-gray-100">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500">Habits</Text>
                      <Text className="text-lg font-bold text-gray-900">
                        {score.habitCount}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500">Points</Text>
                      <Text className="text-lg font-bold text-gray-900">
                        {score.totalPoints.toFixed(1)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500">Today</Text>
                      <Text className="text-lg font-bold text-gray-900">
                        {score.completionRate.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add Button */}
        <Pressable
          onPress={() => {
            resetForm();
            setShowModal(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          className="bg-blue-500 rounded-2xl py-4 items-center justify-center shadow-sm mt-6"
        >
          <View className="flex-row items-center space-x-2">
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text className="text-white text-base font-bold ml-2">
              Create Identity
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <View style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: 60 }}>
          {/* Modal Header */}
          <View
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 16,
              paddingBottom: 16,
              backgroundColor: "#FFFFFF",
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text className="text-2xl font-bold text-gray-900">
              {editingId ? "Edit Identity" : "Create Identity"}
            </Text>
            <Pressable
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 pt-6 pb-20">
            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Identity Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Athlete, Writer, Entrepreneur"
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
                value={description}
                onChangeText={setDescription}
                placeholder="Describe this identity"
                className="bg-white rounded-xl px-4 py-3 text-base text-gray-900 border border-gray-200"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

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
                      setIconName(icon);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "w-14 h-14 rounded-xl items-center justify-center border-2",
                      iconName === icon
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-gray-200"
                    )}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={iconName === icon ? "#3B82F6" : "#6B7280"}
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
                {HABIT_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      setColor(c);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2",
                      color === c ? "border-gray-900" : "border-gray-200"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleCreate}
              className="bg-blue-500 rounded-2xl py-4 items-center justify-center shadow-sm"
            >
              <Text className="text-white text-base font-bold">
                {editingId ? "Save Changes" : "Create Identity"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
