import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./src/i18n";
import RootNavigator from "./src/navigation/RootNavigator";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import SignupScreen from "./src/screens/SignupScreen";
import TutorialScreen from "./src/screens/TutorialScreen";
import useAtomicStore from "./src/state/atomicStore";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<"welcome" | "signup" | "tutorial" | "app">("welcome");
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  const user = useAtomicStore((s) => s.user);
  const hasCompletedOnboarding = useAtomicStore((s) => s.hasCompletedOnboarding);
  const hasSeenTutorial = useAtomicStore((s) => s.hasSeenTutorial);
  const createAccount = useAtomicStore((s) => s.createAccount);
  const completeTutorial = useAtomicStore((s) => s.completeTutorial);

  // Initialize app and determine starting screen
  useEffect(() => {
    const init = async () => {
      try {
        // Wait for store hydration
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Determine which screen to show
        if (!user || !hasCompletedOnboarding) {
          setCurrentScreen("welcome");
        } else if (!hasSeenTutorial) {
          setCurrentScreen("tutorial");
        } else {
          setCurrentScreen("app");
        }

        setIsReady(true);
      } catch (error) {
        console.error("Init error:", error);
        setIsReady(true);
      }
    };
    init();
  }, []);

  // Handle onboarding state changes
  useEffect(() => {
    if (isReady) {
      if (!user || !hasCompletedOnboarding) {
        setCurrentScreen("welcome");
        setIsNavigationReady(false);
      } else if (!hasSeenTutorial) {
        setCurrentScreen("tutorial");
        setIsNavigationReady(false);
      } else {
        setCurrentScreen("app");
        // Give NavigationContainer time to mount
        setTimeout(() => setIsNavigationReady(true), 100);
      }
    }
  }, [user, hasCompletedOnboarding, hasSeenTutorial, isReady]);

  const handleGetStarted = () => {
    setCurrentScreen("signup");
  };

  const handleBackToWelcome = () => {
    setCurrentScreen("welcome");
  };

  const handleSignup = (name: string, email: string, password: string) => {
    createAccount(name, email, password);
    setCurrentScreen("tutorial");
  };

  const handleCompleteTutorial = () => {
    completeTutorial();
    setCurrentScreen("app");
    // Give NavigationContainer time to mount
    setTimeout(() => setIsNavigationReady(true), 100);
  };

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Show appropriate screen based on onboarding state */}
        {currentScreen === "welcome" && (
          <WelcomeScreen onGetStarted={handleGetStarted} />
        )}

        {currentScreen === "signup" && (
          <SignupScreen
            onSignup={handleSignup}
            onBackToWelcome={handleBackToWelcome}
          />
        )}

        {currentScreen === "tutorial" && (
          <TutorialScreen onComplete={handleCompleteTutorial} />
        )}

        {currentScreen === "app" && (
          <NavigationContainer onReady={() => setIsNavigationReady(true)}>
            {isNavigationReady ? <RootNavigator /> : null}
            <StatusBar style="dark" />
          </NavigationContainer>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
