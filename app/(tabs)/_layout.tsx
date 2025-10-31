import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, useWindowDimensions } from "react-native";
import { useTheme } from "../../src/state/ThemeProvider";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { colorScheme, toggleColorScheme } = useTheme();

  // Responsive sizing based on screen width
  // Base sizes for phones, scale up for tablets/larger screens
  const baseIconSize = 28;
  const baseFontSize = 13;
  const scaleFactor = width > 768 ? 1.2 : 1; // Scale up 20% for tablets

  const iconSize = baseIconSize * scaleFactor;
  const fontSize = baseFontSize * scaleFactor;

  // Theme toggle component
  const ThemeToggle = () => (
    <Pressable
      onPress={toggleColorScheme}
      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={colorScheme === "dark" ? "sunny" : "moon"}
        size={24}
        color={colorScheme === "dark" ? "#FFD700" : "#4A5568"}
      />
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <ThemeToggle />,
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t("tabs.add") || "Ajouter",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("tabs.categories") || "Catégories",
          tabBarIcon: ({ color }) => (
            <Ionicons name="pricetags-outline" color={color} size={iconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("tabs.transactions") || "Transactions",
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-outline" color={color} size={iconSize} />
          ),
        }}
      />
    </Tabs>
  );
}
