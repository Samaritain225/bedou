import { DatePicker } from "@/src/components/ui/DatePicker";
import { FormField } from "@/src/components/ui/FormField";
import { PaymentMethod, PaymentMethodPicker } from "@/src/components/ui/PaymentMethodPicker";
import { TextInputField } from "@/src/components/ui/TextInputField";
import { ThemeColors } from "@/src/constants/themeColors";
import { Category } from "@/src/features/categories/types";
import { createTransactionsService } from "@/src/services/firestore/transactions.service";
import { useAuth } from "@/src/state/AuthProvider";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useWallet } from "@/src/state/WalletProvider";
import { handleAmountChange } from "@/src/utils/formHelpers";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
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

const incomeSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  note: z
    .string()
    .max(300, "Note must be less than 300 characters")
    .optional(),
});

interface AddIncomeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddIncomeForm({ onSuccess, onCancel }: AddIncomeFormProps) {
  const { t } = useTranslation();
  // const db = useDb(); // REMOVED
  const { user } = useAuth();
  const { categories, refresh: refreshCategories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { adjustWalletBalance } = useWallet();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont, width, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState("");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    incomeCategories[0] || null
  );
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [errors, setErrors] = useState<{
    amount?: string;
    categoryId?: string;
    note?: string;
  }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const amountInputRef = useRef<TextInput>(null);

  const onAmountChange = (text: string) => {
    handleAmountChange(text, setAmount, () => {
      if (errors.amount) {
        setErrors({ ...errors, amount: undefined });
      }
    });
  };

  const handleNoteChange = (text: string) => {
    if (text.length <= 300) {
      setNote(text);
      if (errors.note) {
        setErrors({ ...errors, note: undefined });
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setGeneralError(null);
      setErrors({});

      if (!selectedCategory) {
        setErrors({ categoryId: t("add.categoryRequired", "Category is required") });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const numericAmount = parseFloat(amount.replace(/,/g, ""));
      const validation = incomeSchema.safeParse({
        amount: numericAmount,
        categoryId: selectedCategory.id,
        note: note.trim() || undefined,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        const field = firstError.path[0] as string;
        setErrors({ [field]: firstError.message });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrors({ amount: t("add.amountRequired", "Amount is required") });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Convert to integer (stored as smallest unit)
      const amountBase = Math.round(numericAmount * 100);

      if (!user) {
        throw new Error("User not authenticated");
      }

      const transactionsService = createTransactionsService(user.uid);

      await transactionsService.create({
        dateISO: selectedDate.toISOString(),
        amountOriginal: amountBase,
        currencyCode: baseCurrency?.code || "XOF",
        amountBase,
        categoryId: selectedCategory.id,
        note: note.trim() || undefined,
        type: "income",
        paymentMethod: paymentMethod || undefined,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Increase wallet balance for income
      await adjustWalletBalance(amountBase, baseCurrency?.code || "XOF");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form
      setAmount("");
      setNote("");
      setPaymentMethod(null);
      setSelectedDate(new Date());
      setSelectedCategory(incomeCategories[0] || null);

      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      console.error("Error adding income:", error);
      setGeneralError(error?.message || t("add.error", "Failed to add income"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const canSubmit =
    amount.trim().length > 0 &&
    selectedCategory !== null &&
    !errors.amount &&
    !errors.categoryId;

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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {onCancel && (
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
                color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
              }}
            >
              {t("add.income", "Add Income")}
            </Text>
            <Pressable onPress={onCancel} style={{ padding: scaleSpacing(8) }}>
              <Ionicons
                name="close"
                size={scaleSize(24)}
                color={isDark ? ThemeColors.dark.text : ThemeColors.light.text}
              />
            </Pressable>
          </View>
        )}

        {/* Success Message */}
        {showSuccess && (
          <Animated.View
            style={{
              marginBottom: scaleSpacing(16),
              paddingVertical: scaleSpacing(12),
              paddingHorizontal: scaleSpacing(16),
              backgroundColor: ThemeColors.light.success,
              borderRadius: scaleSpacing(12),
              flexDirection: "row",
              alignItems: "center",
              gap: scaleSpacing(10),
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={scaleSize(20)}
              color="#FFFFFF"
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: scaleFont(14),
                fontWeight: "600",
                flex: 1,
              }}
            >
              {t("add.incomeSuccess", "Income added successfully")}
            </Text>
          </Animated.View>
        )}

        {/* Error Message */}
        {generalError && (
          <Animated.View
            style={{
              marginBottom: scaleSpacing(16),
              paddingVertical: scaleSpacing(12),
              paddingHorizontal: scaleSpacing(16),
              backgroundColor: ThemeColors.light.error,
              borderRadius: scaleSpacing(12),
              flexDirection: "row",
              alignItems: "center",
              gap: scaleSpacing(10),
            }}
          >
            <Ionicons
              name="alert-circle"
              size={scaleSize(20)}
              color="#FFFFFF"
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: scaleFont(14),
                fontWeight: "600",
                flex: 1,
              }}
            >
              {generalError}
            </Text>
          </Animated.View>
        )}

        {/* Amount Input */}
        <FormField label={t("add.amount", "Amount")} error={errors.amount}>
          <View
            style={{
              borderRadius: scaleSpacing(12),
              paddingHorizontal: scaleSpacing(16),
              paddingVertical: scaleSpacing(14),

              backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
              borderColor: errors.amount
                ? ThemeColors.light.error
                : isDark
                  ? ThemeColors.dark.border
                  : ThemeColors.light.border,
              borderWidth: 1.5,
              flexDirection: "row",
              alignItems: "center",
              gap: scaleSpacing(12),
            }}
          >
            <Text
              style={{
                color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
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
                color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                fontSize: scaleFont(isTablet ? 18 : 16),
                fontWeight: "500",
              }}
              value={amount}
              onChangeText={onAmountChange}
              placeholder="0"
              placeholderTextColor={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>
        </FormField>

        {/* Date Picker */}
        <FormField label={t("add.date", "Date") || "Date"}>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </FormField>

        {/* Category Selector */}
        {incomeCategories.length > 0 ? (
          <FormField label={t("add.category", "Category")} error={errors.categoryId}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // For now, just cycle through categories
                const currentIndex = incomeCategories.findIndex(
                  (c) => c.id === selectedCategory?.id
                );
                const nextIndex =
                  (currentIndex + 1) % incomeCategories.length;
                setSelectedCategory(incomeCategories[nextIndex]);
              }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: scaleSpacing(12),
                    paddingHorizontal: scaleSpacing(16),
                    paddingVertical: scaleSpacing(14),
                    backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
                    borderColor: selectedCategory
                      ? selectedCategory.color
                      : isDark
                        ? ThemeColors.dark.border
                        : ThemeColors.light.border,
                    borderWidth: selectedCategory ? 2 : 1.5,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: pressed ? 0.8 : 1,
                  }}
                >
                  {selectedCategory && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSpacing(12), flex: 1 }}>
                      <View
                        style={{
                          borderRadius: scaleSpacing(8),
                          padding: scaleSpacing(8),
                          backgroundColor: selectedCategory.color + "20",
                        }}
                      >
                        <Ionicons
                          name={selectedCategory.icon as any}
                          size={scaleSize(20)}
                          color={selectedCategory.color}
                        />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                          fontSize: scaleFont(isTablet ? 18 : 16),
                          fontWeight: "600",
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {selectedCategory.name}
                      </Text>
                    </View>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={scaleSize(20)}
                    color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary}
                  />
                </View>
              )}
            </Pressable>
          </FormField>
        ) : (
          <FormField label={t("add.category", "Category")} error={errors.categoryId}>
            <View
              style={{
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(16),
                backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
                borderWidth: 1.5,
                borderColor: ThemeColors.light.error,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: ThemeColors.light.error,
                  fontSize: scaleFont(14),
                  fontWeight: "600",
                }}
              >
                {t("add.noIncomeCategories", "No income categories available. Please create one first.")}
              </Text>
            </View>
          </FormField>
        )}

        {/* Payment Method Picker */}
        <FormField label={t("add.paymentMethod", "Payment Method") || "Payment Method"}>
          <PaymentMethodPicker
            value={paymentMethod}
            onChange={setPaymentMethod}
          />
        </FormField>

        {/* Note Input */}
        <FormField
          label={t("add.note", "Note")}
          labelOptional
          labelOptionalText={t("add.optional", "(Optional)")}
          error={errors.note}
        >
          <TextInputField
            value={note}
            onChangeText={handleNoteChange}
            placeholder={t("add.notePlaceholder", "Add a note...")}
            multiline
            maxLength={300}
            returnKeyType="done"
            error={!!errors.note}
          />
          <Text
            style={{
              color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
              fontSize: scaleFont(isTablet ? 13 : 12),
              marginTop: scaleSpacing(isTablet ? 6 : 4),
              textAlign: "right",
              fontWeight: "500",
            }}
          >
            {note.length}/300
          </Text>
        </FormField>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={{
            opacity: canSubmit ? 1 : 0.5,
            marginTop: scaleSpacing(8),
          }}
        >
          {({ pressed }) => (
            <LinearGradient
              colors={canSubmit ? ThemeColors.light.gradients.success : isDark ? [ThemeColors.dark.border, ThemeColors.dark.surfaceSecondary] : [ThemeColors.light.border, ThemeColors.light.textTertiary]}
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
                shadowColor: canSubmit ? ThemeColors.light.success : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: canSubmit ? 4 : 0,
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
                {t("add.saveIncome", "Save Income")}
              </Text>
            </LinearGradient>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

