import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, useWindowDimensions } from "react-native";
import { useTheme } from "../../src/state/ThemeProvider";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { colorScheme } = useTheme();

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
        tabBarActiveTintColor: "#2563eb",
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: fontSize,
          fontWeight: "600",
          marginTop: 2,
        },
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
        name="categories"
        options={{
          title: t("tabs.categories") || "Catégories",
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
              {t("tabs.categories") || "Categories"}
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <Ionicons name="pricetags-outline" color={color} size={iconSize} />
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
    </Tabs>
  );
}
