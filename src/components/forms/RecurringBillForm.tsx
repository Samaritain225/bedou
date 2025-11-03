import { CurrencyAmountInput } from "@/src/components/ui/CurrencyAmountInput";
import { DatePicker } from "@/src/components/ui/DatePicker";
import { FormField } from "@/src/components/ui/FormField";
import { PaymentMethodPicker } from "@/src/components/ui/PaymentMethodPicker";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { TextInputField } from "@/src/components/ui/TextInputField";
import { useDb } from "@/src/db/hooks";
import { Category } from "@/src/features/categories/types";
import {
    createRecurringBill,
    updateRecurringBill,
} from "@/src/features/recurring-bills/repository";
import {
    RecurringBill,
    RecurringFrequency,
} from "@/src/features/recurring-bills/types";
import { PaymentMethod } from "@/src/features/transactions/types";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { handleAmountChange } from "@/src/utils/formHelpers";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

interface RecurringBillFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialBill?: RecurringBill;
}

const FREQUENCY_OPTIONS: Array<{
  value: RecurringFrequency;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "daily", label: "Daily", icon: "calendar-outline" },
  { value: "weekly", label: "Weekly", icon: "calendar-outline" },
  { value: "monthly", label: "Monthly", icon: "calendar-outline" },
  { value: "yearly", label: "Yearly", icon: "calendar-outline" },
];

export function RecurringBillForm({
  onSuccess,
  onCancel,
  initialBill,
}: RecurringBillFormProps) {
  const { t } = useTranslation();
  const db = useDb();
  const { categories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { scaleSpacing, scaleSize, scaleFont, isTablet } = useResponsive();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const isEditing = !!initialBill;

  const [name, setName] = useState(initialBill?.name || "");
  const [amount, setAmount] = useState(
    initialBill ? (initialBill.amountBase / 100).toString() : ""
  );
  const [frequency, setFrequency] = useState<RecurringFrequency>(
    initialBill?.frequency || "monthly"
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    initialBill?.categoryId
      ? categories.find((c) => c.id === initialBill.categoryId) || null
      : null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    initialBill?.paymentMethod || null
  );
  const [nextDueDate, setNextDueDate] = useState<Date>(
    initialBill?.nextDueDate ? new Date(initialBill.nextDueDate) : new Date()
  );
  const [note, setNote] = useState(initialBill?.note || "");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    amount?: string;
    categoryId?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = useMemo(
    () => categories.filter((cat) => cat.type === "expense"),
    [categories]
  );

  const frequencyConfig = useMemo(
    () => FREQUENCY_OPTIONS.find((f) => f.value === frequency),
    [frequency]
  );

  const handleSubmit = async () => {
    try {
      const numericAmount = parseFloat(amount);
      if (!name.trim()) {
        setErrors({ name: t("recurring.nameRequired", "Name is required") });
        return;
      }
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrors({
          amount: t("recurring.amountRequired", "Please enter a valid amount"),
        });
        return;
      }

      if (!selectedCategory) {
        setErrors({
          categoryId: t("recurring.categoryRequired", "Category is required"),
        });
        return;
      }

      setErrors({});
      setIsSubmitting(true);

      const amountBase = Math.round(numericAmount * 100);

      if (isEditing && initialBill) {
        // Update existing bill
        await updateRecurringBill(
          initialBill.id,
          {
            name: name.trim(),
            amountBase,
            currencyCode: baseCurrency?.code || "XOF",
            categoryId: selectedCategory.id,
            paymentMethod,
            frequency,
            nextDueDate: nextDueDate.toISOString(),
            note: note.trim() || null,
          },
          db
        );
      } else {
        // Add new bill
        await createRecurringBill(
          {
            name: name.trim(),
            amountBase,
            currencyCode: baseCurrency?.code || "XOF",
            categoryId: selectedCategory.id,
            paymentMethod,
            frequency,
            nextDueDate: nextDueDate.toISOString(),
            note: note.trim() || null,
            isActive: true,
          },
          db
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form only if not editing
      if (!isEditing) {
        setName("");
        setAmount("");
        setFrequency("monthly");
        setSelectedCategory(null);
        setPaymentMethod(null);
        setNextDueDate(new Date());
        setNote("");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving recurring bill:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({
        amount: t("recurring.saveError", "Failed to save. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAmountChange = (text: string) => {
    handleAmountChange(text, setAmount, () => {
      if (errors.amount) {
        setErrors({ ...errors, amount: undefined });
      }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      enabled={Platform.OS === "ios"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: scaleSpacing(isTablet ? 32 : 24),
          paddingBottom: scaleSpacing(isTablet ? 40 : 32),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: "100%",
            maxWidth: isTablet ? 600 : "100%",
            alignSelf: "center",
          }}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: scaleFont(isTablet ? 32 : 28),
              fontWeight: "700",
              color: isDark ? "#FFFFFF" : "#111827",
              marginBottom: scaleSpacing(24),
            }}
          >
            {isEditing
              ? t("recurring.editBill", "Edit Recurring Bill")
              : t("recurring.addBill", "Add Recurring Bill")}
          </Text>

          {/* Name Input */}
          <FormField label={t("recurring.name", "Bill Name")} error={errors.name}>
            <TextInputField
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder={t("recurring.namePlaceholder", "e.g., Rent, Internet, Netflix")}
              error={errors.name}
            />
          </FormField>

          {/* Amount Input */}
          <FormField label={t("recurring.amount", "Amount")} error={errors.amount}>
            <CurrencyAmountInput
              value={amount}
              onChangeText={onAmountChange}
              error={errors.amount}
            />
          </FormField>

          {/* Category Selector */}
          <FormField label={t("recurring.category", "Category")} error={errors.categoryId}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCategoryModal(true);
              }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: scaleSpacing(12),
                    paddingHorizontal: scaleSpacing(16),
                    paddingVertical: scaleSpacing(14),
                    backgroundColor: isDark ? "#374151" : "#FFFFFF",
                    borderColor: selectedCategory
                      ? selectedCategory.color
                      : errors.categoryId
                        ? "#EF4444"
                        : isDark
                          ? "#4B5563"
                          : "#E5E7EB",
                    borderWidth: selectedCategory ? 2 : 1.5,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: pressed ? 0.8 : 1,
                  }}
                >
                  {selectedCategory ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: scaleSpacing(12),
                        flex: 1,
                      }}
                    >
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
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: scaleFont(16),
                          fontWeight: "600",
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {selectedCategory.name}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        flex: 1,
                        color: isDark ? "#9CA3AF" : "#9CA3AF",
                        fontSize: scaleFont(16),
                      }}
                    >
                      {t("recurring.selectCategory", "Select category")}
                    </Text>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={scaleSize(20)}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </View>
              )}
            </Pressable>
          </FormField>

          {/* Payment Method Picker */}
          <FormField label={t("recurring.paymentMethod", "Payment Method")}>
            <PaymentMethodPicker
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </FormField>

          {/* Frequency Selector */}
          <FormField label={t("recurring.frequency", "Frequency")}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFrequencyModal(true);
              }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: scaleSpacing(12),
                    paddingHorizontal: scaleSpacing(16),
                    paddingVertical: scaleSpacing(14),
                    backgroundColor: isDark ? "#374151" : "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: isDark ? "#4B5563" : "#E5E7EB",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: pressed ? 0.8 : 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scaleSpacing(12),
                      flex: 1,
                    }}
                  >
                    <Ionicons
                      name={frequencyConfig?.icon || "calendar-outline"}
                      size={scaleSize(20)}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <Text
                      style={{
                        color: isDark ? "#FFFFFF" : "#111827",
                        fontSize: scaleFont(16),
                        fontWeight: "600",
                      }}
                    >
                      {t(
                        `recurring.frequency.${frequency}`,
                        frequencyConfig?.label || "Monthly"
                      )}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={scaleSize(20)}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </View>
              )}
            </Pressable>
          </FormField>

          {/* Next Due Date Picker */}
          <FormField label={t("recurring.nextDueDate", "Next Due Date")}>
            <DatePicker value={nextDueDate} onChange={setNextDueDate} />
          </FormField>

          {/* Note Input */}
          <FormField label={t("recurring.note", "Note")} optional>
            <TextInputField
              value={note}
              onChangeText={setNote}
              placeholder={t("recurring.notePlaceholder", "Optional note")}
              multiline
              numberOfLines={3}
            />
          </FormField>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: scaleSpacing(12),
              marginTop: scaleSpacing(24),
            }}
          >
            {onCancel && (
              <Pressable
                onPress={onCancel}
                style={{
                  flex: 1,
                  paddingVertical: scaleSpacing(14),
                  borderRadius: scaleSpacing(12),
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(16),
                    fontWeight: "600",
                  }}
                >
                  {t("common.cancel", "Cancel")}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{
                flex: 1,
                paddingVertical: scaleSpacing(14),
                borderRadius: scaleSpacing(12),
                backgroundColor: isDark ? "#3B82F6" : "#2563EB",
                alignItems: "center",
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: scaleFont(16),
                  fontWeight: "600",
                }}
              >
                {isSubmitting
                  ? t("common.saving", "Saving...")
                  : isEditing
                    ? t("common.save", "Save")
                    : t("common.add", "Add")}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <SimpleBottomSheet
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      >
        <View style={{ paddingBottom: scaleSpacing(20) }}>
          <Text
            style={{
              fontSize: scaleFont(20),
              fontWeight: "700",
              color: isDark ? "#FFFFFF" : "#111827",
              marginBottom: scaleSpacing(16),
              paddingHorizontal: scaleSpacing(20),
            }}
          >
            {t("recurring.selectCategory", "Select Category")}
          </Text>
          <FlatList
            data={expenseCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedCategory?.id === item.id;
              return (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(item);
                    setShowCategoryModal(false);
                    if (errors.categoryId) {
                      setErrors({ ...errors, categoryId: undefined });
                    }
                  }}
                  style={{
                    paddingHorizontal: scaleSpacing(20),
                    paddingVertical: scaleSpacing(16),
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isSelected
                      ? isDark
                        ? "#374151"
                        : "#F3F4F6"
                      : "transparent",
                  }}
                >
                  <View
                    style={{
                      borderRadius: scaleSpacing(8),
                      padding: scaleSpacing(8),
                      backgroundColor: item.color + "20",
                      marginRight: scaleSpacing(12),
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={scaleSize(20)}
                      color={item.color}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontSize: scaleFont(16),
                      fontWeight: isSelected ? "600" : "500",
                    }}
                  >
                    {item.name}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={scaleSize(24)}
                      color={item.color}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </SimpleBottomSheet>

      {/* Frequency Selection Modal */}
      <SimpleBottomSheet
        visible={showFrequencyModal}
        onClose={() => setShowFrequencyModal(false)}
      >
        <View style={{ paddingBottom: scaleSpacing(20) }}>
          <Text
            style={{
              fontSize: scaleFont(20),
              fontWeight: "700",
              color: isDark ? "#FFFFFF" : "#111827",
              marginBottom: scaleSpacing(16),
              paddingHorizontal: scaleSpacing(20),
            }}
          >
            {t("recurring.selectFrequency", "Select Frequency")}
          </Text>
          <FlatList
            data={FREQUENCY_OPTIONS}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = frequency === item.value;
              return (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFrequency(item.value);
                    setShowFrequencyModal(false);
                  }}
                  style={{
                    paddingHorizontal: scaleSpacing(20),
                    paddingVertical: scaleSpacing(16),
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isSelected
                      ? isDark
                        ? "#374151"
                        : "#F3F4F6"
                      : "transparent",
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={scaleSize(20)}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                    style={{ marginRight: scaleSpacing(12) }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontSize: scaleFont(16),
                      fontWeight: isSelected ? "600" : "500",
                    }}
                  >
                    {t(`recurring.frequency.${item.value}`, item.label)}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={scaleSize(24)}
                      color={isDark ? "#3B82F6" : "#2563EB"}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </SimpleBottomSheet>
    </KeyboardAvoidingView>
  );
}

