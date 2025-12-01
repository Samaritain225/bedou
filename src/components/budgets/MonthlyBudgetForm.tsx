import { FormField } from "@/src/components/ui/FormField";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { handleAmountChange } from "@/src/utils/formHelpers";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const budgetSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
});

interface MonthlyBudgetFormProps {
  initialBudget?: { monthYYYYMM: string; amountBase: number } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MonthlyBudgetForm({
  initialBudget,
  onSuccess,
  onCancel,
}: MonthlyBudgetFormProps) {
  const { t } = useTranslation();
  // const db = useDb(); // REMOVED
  const { setMonthlyBudget, currentMonth } = useCategories();
  const { baseCurrency } = useCurrency();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  const initialAmount = initialBudget
    ? (initialBudget.amountBase / 100).toString()
    : "";
  const [amount, setAmount] = useState(initialAmount);
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  const onAmountChange = (text: string) => {
    handleAmountChange(text, setAmount, () => {
      if (errors.amount) {
        setErrors({ ...errors, amount: undefined });
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setErrors({});

      const numericAmount = parseFloat(amount.replace(/,/g, ""));
      const validation = budgetSchema.safeParse({ amount: numericAmount });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        setErrors({ amount: firstError.message });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrors({ amount: t("add.amountRequired", "Amount is required") });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setIsSubmitting(true);

      // Convert to integer (stored as smallest unit)
      const amountBase = Math.round(numericAmount * 100);
      const monthYYYYMM = initialBudget?.monthYYYYMM || currentMonth;

      await setMonthlyBudget(monthYYYYMM, amountBase);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form
      setAmount("");
      setErrors({});

      onSuccess();
    } catch (error: any) {
      console.error("Error setting monthly budget:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({
        amount: error?.message || t("budget.error", "Failed to set budget"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = amount.trim().length > 0 && !isSubmitting;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: scaleSpacing(20),
          paddingBottom: Math.max(insets.bottom, scaleSpacing(20)),
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: scaleSpacing(24),
          }}
        >
          <Text
            style={{
              fontSize: scaleFont(24),
              fontWeight: "700",
              color: isDark ? "#FFFFFF" : "#111827",
            }}
          >
            {initialBudget
              ? t("budget.editMonthly", "Edit Monthly Budget")
              : t("budget.setMonthly", "Set Monthly Budget")}
          </Text>
          <Pressable onPress={onCancel} style={{ padding: scaleSpacing(8) }}>
            <Ionicons
              name="close"
              size={scaleSize(24)}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </Pressable>
        </View>

        {/* Amount Input */}
        <FormField label={t("add.amount", "Amount")} error={errors.amount}>
          <View
            style={{
              borderRadius: scaleSpacing(12),
              paddingHorizontal: scaleSpacing(16),
              paddingVertical: scaleSpacing(14),
              backgroundColor: isDark ? "#374151" : "#FFFFFF",
              borderColor: errors.amount
                ? "#EF4444"
                : isDark
                  ? "#4B5563"
                  : "#E5E7EB",
              borderWidth: 1.5,
              flexDirection: "row",
              alignItems: "center",
              gap: scaleSpacing(12),
            }}
          >
            <Text
              style={{
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(isTablet ? 18 : 16),
                fontWeight: "600",
                minWidth: scaleSize(isTablet ? 60 : 50),
              }}
            >
              {baseCurrency?.symbol || baseCurrency?.code || ""}
            </Text>
            <TextInput
              ref={amountInputRef}
              style={{
                flex: 1,
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(isTablet ? 18 : 16),
                fontWeight: "500",
              }}
              value={amount}
              onChangeText={onAmountChange}
              placeholder="0"
              placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>
        </FormField>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={{
            opacity: canSubmit ? 1 : 0.5,
            marginTop: scaleSpacing(24),
          }}
        >
          {({ pressed }) => (
            <LinearGradient
              colors={
                canSubmit
                  ? ["#10B981", "#059669"]
                  : isDark
                    ? ["#4B5563", "#374151"]
                    : ["#D1D5DB", "#9CA3AF"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: scaleSpacing(12),
                paddingVertical: scaleSpacing(isTablet ? 18 : 16),
                paddingHorizontal: scaleSpacing(isTablet ? 24 : 20),
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: scaleFont(isTablet ? 18 : 16),
                  fontWeight: "600",
                  letterSpacing: 0.3,
                }}
              >
                {isSubmitting
                  ? t("budget.saving", "Saving...")
                  : initialBudget
                    ? t("budget.update", "Update Budget")
                    : t("budget.set", "Set Budget")}
              </Text>
            </LinearGradient>
          )}
        </Pressable>

        {/* Delete Button (if editing) */}
        {initialBudget && (
          <Pressable
            onPress={async () => {
              try {
                await setMonthlyBudget(initialBudget.monthYYYYMM, 0);
                onSuccess();
              } catch (error) {
                console.error("Error deleting budget:", error);
              }
            }}
            style={{
              marginTop: scaleSpacing(12),
              paddingVertical: scaleSpacing(12),
              paddingHorizontal: scaleSpacing(20),
              backgroundColor: isDark ? "#374151" : "#F3F4F6",
              borderRadius: scaleSpacing(12),
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: "#EF4444",
            }}
          >
            <Text
              style={{
                color: "#EF4444",
                fontSize: scaleFont(16),
                fontWeight: "600",
              }}
            >
              {t("budget.delete", "Delete Budget")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

