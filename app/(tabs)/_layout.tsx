import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/state/AuthProvider";
import { useTheme } from "../../src/state/ThemeProvider";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Protect tabs route
  if (!loading && !user) {
    // This should be handled by root layout, but as a safety check
    return null;
  }

  // Responsive sizing based on screen width
  // Base sizes for phones, scale up for tablets/larger screens
  const baseIconSize = 24;
  const baseFontSize = 11;
  const scaleFactor = width > 768 ? 1.2 : 1; // Scale up 20% for tablets

  const iconSize = baseIconSize * scaleFactor;
  const fontSize = baseFontSize * scaleFactor;

  // Settings icon component
  const SettingsIcon = () => (
    <Pressable
      onPress={() => router.push("/settings")}
      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name="settings-outline"
        size={24}
        color={colorScheme === "dark" ? "#FFFFFF" : "#111827"}
      />
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <SettingsIcon />,
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#111827" : "#FFFFFF",
          elevation: 0, // Android
          shadowOpacity: 0, // iOS
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === "dark" ? "#374151" : "#E5E7EB",
          height: Platform.OS === "android" ? 56 + insets.top : undefined, // Account for status bar on Android
        },
        headerStatusBarHeight: Platform.OS === "android" ? insets.top : undefined,
        headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#111827",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: fontSize,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.dashboard") || "Tableau de bord",
          tabBarLabel: ({ focused }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{
                fontSize: fontSize,
                fontWeight: "600",
                color: focused ? "#2563eb" : "#6B7280",
                textAlign: "center",
                marginTop: 2,
              }}
            >
              {t("tabs.dashboard") || "Dashboard"}
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("tabs.transactions") || "Transactions",
          tabBarLabel: ({ focused }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{
                fontSize: fontSize,
                fontWeight: "600",
                color: focused ? "#2563eb" : "#6B7280",
                textAlign: "center",
                marginTop: 2,
              }}
            >
              {t("tabs.transactions") || "Transactions"}
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t("tabs.add") || "Ajouter",
          tabBarLabel: ({ focused }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{
                fontSize: fontSize,
                fontWeight: "600",
                color: focused ? "#2563eb" : "#6B7280",
                textAlign: "center",
                marginTop: 2,
              }}
            >
              {t("tabs.add") || "Add"}
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="currency-converter"
        options={{
          title: t("tabs.currency", "Converter"),
          tabBarLabel: ({ focused }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{
                fontSize: fontSize,
                fontWeight: "600",
                color: focused ? "#2563eb" : "#6B7280",
                textAlign: "center",
                marginTop: 2,
              }}
            >
              {t("tabs.currency", "Converter")}
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <Ionicons name="cash-outline" color={color} size={iconSize} />
          ),
        }}
      />
    </Tabs>
  );
}
