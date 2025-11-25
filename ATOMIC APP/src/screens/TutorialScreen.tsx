// ========================================
// TUTORIAL SCREEN
// Onboarding walkthrough after signup
// ========================================

import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Pressable, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface TutorialScreenProps {
  onComplete: () => void;
}

interface TutorialStep {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color1: string;
  color2: string;
}

const TUTORIAL_STEPS = (t: any): TutorialStep[] => [
  {
    id: "1",
    icon: "checkmark-circle",
    title: t('tutorial.step1.title'),
    description: t('tutorial.step1.desc'),
    color1: "#667eea",
    color2: "#764ba2",
  },
  {
    id: "2",
    icon: "flame",
    title: t('tutorial.step2.title'),
    description: t('tutorial.step2.desc'),
    color1: "#f093fb",
    color2: "#f5576c",
  },
  {
    id: "3",
    icon: "trophy",
    title: t('tutorial.step3.title'),
    description: t('tutorial.step3.desc'),
    color1: "#4facfe",
    color2: "#00f2fe",
  },
  {
    id: "4",
    icon: "flag",
    title: t('tutorial.step4.title'),
    description: t('tutorial.step4.desc'),
    color1: "#43e97b",
    color2: "#38f9d7",
  },
  {
    id: "5",
    icon: "planet",
    title: t('tutorial.step5.title'),
    description: t('tutorial.step5.desc'),
    color1: "#fa709a",
    color2: "#fee140",
  },
];

export default function TutorialScreen({ onComplete }: TutorialScreenProps) {
  const { t } = useTranslation();
  const steps = TUTORIAL_STEPS(t);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < steps.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      onComplete();
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderItem = ({ item }: { item: TutorialStep }) => (
    <LinearGradient
      colors={[item.color1, item.color2]}
      style={{ width, flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-32 h-32 rounded-full bg-white/20 items-center justify-center mb-8">
          <Ionicons name={item.icon} size={72} color="white" />
        </View>

        <Text className="text-4xl font-bold text-white text-center mb-4">
          {item.title}
        </Text>

        <Text className="text-lg text-white/90 text-center leading-7">
          {item.description}
        </Text>
      </View>
    </LinearGradient>
  );

  const currentStep = steps[currentIndex];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEnabled={true}
      />

      {/* Overlay Controls */}
      <LinearGradient
        colors={[currentStep.color1, currentStep.color2]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 48,
          paddingTop: 24,
          paddingHorizontal: 24,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Skip Button */}
        {currentIndex < steps.length - 1 && (
          <Pressable
            onPress={handleSkip}
            className="absolute top-6 right-6"
          >
            <Text className="text-white font-semibold text-base">{t('tutorial.skip')}</Text>
          </Pressable>
        )}

        {/* Pagination Dots */}
        <View className="flex-row justify-center mb-6">
          {steps.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${index === currentIndex ? "bg-white" : "bg-white/40"
                }`}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <Pressable
          onPress={handleNext}
          className="bg-white rounded-2xl py-4 items-center shadow-lg active:opacity-90"
        >
          <Text
            className="font-bold text-lg"
            style={{ color: currentStep.color1 }}
          >
            {currentIndex < steps.length - 1 ? t('tutorial.next') : t('tutorial.get_started')}
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
