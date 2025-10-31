import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { I18nManager, Text, TextInput } from "react-native";
import "react-native-reanimated";
import "../global.css";
import { initDatabase } from "../src/db";
import "../src/i18n/setup";
import { CategoriesProvider } from "../src/state/CategoriesProvider";
import { CurrencyProvider } from "../src/state/CurrencyProvider";
import { ThemeProvider, useTheme } from "../src/state/ThemeProvider";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppContent() {
  const { colorScheme } = useTheme();
  const [fontsLoaded] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-BlackItalic": require("../assets/fonts/Poppins-BlackItalic.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-BoldItalic": require("../assets/fonts/Poppins-BoldItalic.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraBoldItalic": require("../assets/fonts/Poppins-ExtraBoldItalic.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-ExtraLightItalic": require("../assets/fonts/Poppins-ExtraLightItalic.ttf"),
    "Poppins-Italic": require("../assets/fonts/Poppins-Italic.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-LightItalic": require("../assets/fonts/Poppins-LightItalic.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-MediumItalic": require("../assets/fonts/Poppins-MediumItalic.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-SemiBoldItalic": require("../assets/fonts/Poppins-SemiBoldItalic.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
    "Poppins-ThinItalic": require("../assets/fonts/Poppins-ThinItalic.ttf"),
  });

  useEffect(() => {
    if (I18nManager.isRTL) {
      I18nManager.allowRTL(false);
      I18nManager.forceRTL(false);
    }
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      const TextAny: any = Text;
      const TextInputAny: any = TextInput;
      TextAny.defaultProps ??= {};
      TextInputAny.defaultProps ??= {};
      TextAny.defaultProps.style = [
        { fontFamily: "Poppins-Regular" },
        TextAny.defaultProps.style,
      ];
      TextInputAny.defaultProps.style = [
        { fontFamily: "Poppins-Regular" },
        TextInputAny.defaultProps.style,
      ];
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // Always render the Stack, even if fonts aren't loaded yet
  // The app should still be functional
  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <SQLiteProvider
        databaseName="bedou.db"
        onInit={initDatabase}
        options={{ enableChangeListener: true }}
      >
        <CurrencyProvider>
          <CategoriesProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </CategoriesProvider>
        </CurrencyProvider>
      </SQLiteProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
