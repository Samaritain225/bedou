import { AddIncomeForm } from "@/src/components/forms/AddIncomeForm";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { ThemeColors } from "@/src/constants/themeColors";
import { useTheme } from "@/src/state/ThemeProvider";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface QuickActionsProps {
  onRefresh?: () => void;
}

export function QuickActions({ onRefresh }: QuickActionsProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();

  const [showIncomeForm, setShowIncomeForm] = useState(false);

  return (
    <View
      style={{
        paddingHorizontal: scaleSpacing(20),
        marginBottom: scaleSpacing(20),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: scaleSpacing(12),
        }}
      >
        {/* Add Expense Button */}
        <Pressable
          onPress={() => router.push("/(tabs)/add")}
          style={{
            flex: 1,
            borderRadius: scaleSpacing(12),
            paddingVertical: scaleSpacing(14),
            paddingHorizontal: scaleSpacing(16),
            backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
            borderWidth: 1.5,
            borderColor: isDark ? ThemeColors.dark.border : ThemeColors.light.border,
            alignItems: "center",
            justifyContent: "center",
            gap: scaleSpacing(8),
            minHeight: scaleSpacing(64),
          }}
        >
          <View
            style={{
              width: scaleSize(32),
              height: scaleSize(32),
              borderRadius: scaleSize(16),
              backgroundColor: "#EF444420",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="remove-circle" size={scaleSize(20)} color="#EF4444" />
          </View>
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(12),
              fontWeight: "600",
            }}
          >
            {t("quickActions.addExpense", "Expense")}
          </Text>
        </Pressable>

        {/* Add Income Button */}
        <Pressable
          onPress={() => setShowIncomeForm(true)}
          style={{
            flex: 1,
            borderRadius: scaleSpacing(12),
            paddingVertical: scaleSpacing(14),
            paddingHorizontal: scaleSpacing(16),
            backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
            borderWidth: 1.5,
            borderColor: isDark ? ThemeColors.dark.border : ThemeColors.light.border,
            alignItems: "center",
            justifyContent: "center",
            gap: scaleSpacing(8),
            minHeight: scaleSpacing(64),
          }}
        >
          <View
            style={{
              width: scaleSize(32),
              height: scaleSize(32),
              borderRadius: scaleSize(16),
              backgroundColor: "#10B98120",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add-circle" size={scaleSize(20)} color="#10B981" />
          </View>
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(12),
              fontWeight: "600",
            }}
          >
            {t("quickActions.addIncome", "Income")}
          </Text>
        </Pressable>
      </View>

      {/* Income Form Modal */}
      <SimpleBottomSheet
        visible={showIncomeForm}
        onClose={() => setShowIncomeForm(false)}
      >
        <AddIncomeForm
          onSuccess={() => {
            setShowIncomeForm(false);
            onRefresh?.();
          }}
          onCancel={() => setShowIncomeForm(false)}
        />
      </SimpleBottomSheet>
    </View>
  );
}

