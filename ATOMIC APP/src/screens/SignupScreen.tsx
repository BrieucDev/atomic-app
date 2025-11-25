// ========================================
// SIGNUP SCREEN
// Account creation screen
// ========================================

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface SignupScreenProps {
  onSignup: (name: string, email: string, password: string) => void;
  onBackToWelcome: () => void;
}

export default function SignupScreen({ onSignup, onBackToWelcome }: SignupScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Validation
    if (!name.trim()) {
      setError(t('signup.error.name'));
      return;
    }
    if (!email.trim()) {
      setError(t('signup.error.email'));
      return;
    }
    if (!email.includes("@")) {
      setError(t('signup.error.email_valid'));
      return;
    }
    if (password.length < 6) {
      setError(t('signup.error.password'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('signup.error.password_match'));
      return;
    }

    setError("");
    onSignup(name.trim(), email.trim().toLowerCase(), password);
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackToWelcome();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-16 pb-8">
            {/* Back Button */}
            <Pressable onPress={handleBack} className="mb-8">
              <Ionicons name="arrow-back" size={28} color="#111827" />
            </Pressable>

            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-bold text-gray-900 mb-2">{t('signup.title')}</Text>
              <Text className="text-lg text-gray-600">
                {t('signup.subtitle')}
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4 mb-6">
              {/* Name Input */}
              <View>
                <Text className="text-gray-900 font-medium mb-2">{t('signup.name_label')}</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-4 flex-row items-center border border-gray-200">
                  <Ionicons name="person-outline" size={20} color="#6B7280" />
                  <TextInput
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError("");
                    }}
                    placeholder={t('signup.name_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-gray-900 text-base"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View>
                <Text className="text-gray-900 font-medium mb-2">{t('signup.email_label')}</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-4 flex-row items-center border border-gray-200">
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError("");
                    }}
                    placeholder={t('signup.email_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-gray-900 text-base"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-900 font-medium mb-2">{t('signup.password_label')}</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-4 flex-row items-center border border-gray-200">
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError("");
                    }}
                    placeholder={t('signup.password_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-gray-900 text-base"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text className="text-gray-900 font-medium mb-2">{t('signup.confirm_password_label')}</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-4 flex-row items-center border border-gray-200">
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setError("");
                    }}
                    placeholder={t('signup.confirm_password_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-gray-900 text-base"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 rounded-xl px-4 py-3 mb-4 border border-red-200">
                <Text className="text-red-700 text-center font-medium">{error}</Text>
              </View>
            ) : null}

            {/* Signup Button */}
            <Pressable
              onPress={handleSignup}
              className="bg-blue-500 rounded-2xl py-4 items-center shadow-lg active:opacity-90 mb-4"
            >
              <Text className="text-white font-bold text-lg">{t('signup.button')}</Text>
            </Pressable>

            {/* Terms */}
            <Text className="text-gray-500 text-xs text-center">
              {t('signup.terms')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
