```javascript
// ========================================
// WELCOME SCREEN
// First screen shown when app opens (no account)
// ========================================

import React from "react";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Pressable } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      const savedLang = await AsyncStorage.getItem('language');
      if (savedLang && savedLang !== i18n.language) {
        i18n.changeLanguage(savedLang);
      }
    })();
  }, []);
  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGetStarted();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View className="flex-1 justify-between px-6 pt-20 pb-12">
        {/* Logo & Title */}
        <View className="items-center mt-16">
          <View className="w-24 h-24 rounded-3xl bg-blue-500 items-center justify-center mb-6">
            <Ionicons name="planet" size={56} color="white" />
          </View>
          <Text className="text-5xl font-bold text-gray-900 mb-3">{t('welcome.title')}</Text>
          <Text className="text-lg text-gray-600 text-center">
            {t('welcome.subtitle')}
          </Text>
        </View>

        {/* Language Selector */
<View className="flex-row justify-center mb-4">
  <Pressable onPress={() => { i18n.changeLanguage('en'); AsyncStorage.setItem('language','en'); }} className="mx-2">
    <Text className="text-blue-500">EN</Text>
  </Pressable>
  <Pressable onPress={() => { i18n.changeLanguage('fr'); AsyncStorage.setItem('language','fr'); }} className="mx-2">
    <Text className="text-blue-500">FR</Text>
  </Pressable>
</View>
/* Features */}
        <View className="space-y-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-base">{t('feature.track')}</Text>
              <Text className="text-gray-600 text-sm">{t('feature.track_desc')}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Ionicons name="trophy" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-base">{t('feature.earn')}</Text>
              <Text className="text-gray-600 text-sm">{t('feature.earn_desc')}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Ionicons name="flag" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-base">{t('feature.set_goals')}</Text>
              <Text className="text-gray-600 text-sm">{t('feature.set_goals_desc')}</Text>
            </View>
          </View>
        </View>

        {/* Get Started Button */}
        <Pressable
          onPress={handleGetStarted}
          className="bg-blue-500 rounded-2xl py-4 items-center shadow-lg active:opacity-90"
        >
          <Text className="text-white font-bold text-lg">{t('button.get_started')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
```
