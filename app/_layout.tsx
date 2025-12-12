import { ThemeColors } from "@/src/constants/themeColors";
import { useFirebaseInitialization } from "@/src/hooks/firestore/useFirebaseInitialization";
import "@/src/i18n/setup";
import { AuthProvider } from "@/src/state/AuthProvider";
import { CategoriesProvider } from "@/src/state/CategoriesProvider";
import { CurrencyProvider } from "@/src/state/CurrencyProvider";
import { OnboardingProvider } from "@/src/state/OnboardingProvider";
import { ThemeProvider, useTheme } from "@/src/state/ThemeProvider";
import { WalletProvider } from "@/src/state/WalletProvider";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

import { useProtectedRoute } from "@/src/hooks/useProtectedRoute";

// ... imports

function AppContent() {
  const { colorScheme } = useTheme();
  // Use the protected route hook
  useProtectedRoute();

  const [fontsLoaded] = useFonts({
    // ... fonts
  });

  // Initialize Firebase
  useFirebaseInitialization();

  // ... rest of the component

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? ThemeColors.dark.background : ThemeColors.light.background }}>
        <ActivityIndicator size="large" color={ThemeColors.light.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationThemeProvider
        value={
          colorScheme === "dark"
            ? {
                ...DarkTheme,
                colors: {
                  ...DarkTheme.colors,
                  primary: ThemeColors.dark.primary,
                  background: ThemeColors.dark.background,
                  card: ThemeColors.dark.surface,
                  text: ThemeColors.dark.text,
                  border: ThemeColors.dark.border,
                  notification: ThemeColors.dark.error,
                },
              }
            : {
                ...DefaultTheme,
                colors: {
                  ...DefaultTheme.colors,
                  primary: ThemeColors.light.primary,
                  background: ThemeColors.light.background,
                  card: ThemeColors.light.surface,
                  text: ThemeColors.light.text,
                  border: ThemeColors.light.border,
                  notification: ThemeColors.light.error,
                },
              }
        }
      >
        <OnboardingProvider>
          <CurrencyProvider>
            <WalletProvider>
              <CategoriesProvider>
                <Stack>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="settings"
                    options={{
                      presentation: "modal",
                      headerShown: false,
                      title: "",
                      headerTitle: "",
                      headerBackVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="recurring-bills"
                    options={{
                      presentation: "modal",
                      headerShown: false,
                      title: "",
                      headerTitle: "",
                      headerBackVisible: false,
                    }}
                  />
                </Stack>
              </CategoriesProvider>
            </WalletProvider>
          </CurrencyProvider>
        </OnboardingProvider>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} translucent />
      </NavigationThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
