import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { z } from "zod";
import { generateUuid } from "../../db";
import { useDb } from "../../db/hooks";
import { Category } from "../../features/categories/types";
import { useCategories } from "../../state/CategoriesProvider";
import { useCurrency } from "../../state/CurrencyProvider";
import { useTheme } from "../../state/ThemeProvider";
import { useResponsive } from "../../utils/responsive";

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  note: z
    .string()
    .max(300, "Note must be less than 300 characters")
    .optional()
    .nullable(),
});

export function AddExpenseForm() {
  const { t } = useTranslation();
  const db = useDb();
  const { categories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [note, setNote] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    categoryId?: string;
    note?: string;
  }>({});

  // Filter expense categories
  const expenseCategories = categories.filter((cat) => cat.type === "expense");

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length <= 2) {
      setAmount(cleaned);
    }
    if (errors.amount) {
      setErrors({ ...errors, amount: undefined });
    }
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
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrors({ amount: t("add.amountRequired") || "Please enter a valid amount" });
        return;
      }

      if (!selectedCategory) {
        setErrors({ categoryId: t("add.categoryRequired") || "Please select a category" });
        return;
      }

      // Validate with Zod
      const result = expenseSchema.safeParse({
        amount: numericAmount,
        categoryId: selectedCategory.id,
        note: note.trim() || null,
      });

      if (!result.success) {
        const newErrors: typeof errors = {};
        for (const err of result.error.errors) {
          const field = err.path[0] as keyof typeof errors;
          if (field) {
            newErrors[field] = err.message;
          }
        }
        setErrors(newErrors);
        return;
      }

      setErrors({});

      // Convert to integer (stored as smallest unit)
      const amountBase = Math.round(numericAmount * 100);
      const transactionId = generateUuid();

      await db.runAsync(
        "INSERT INTO transactions (id, dateISO, amountOriginal, currencyCode, amountBase, categoryId, note, type, tagsJSON) VALUES (?,?,?,?,?,?,?,?,?)",
        transactionId,
        new Date().toISOString(),
        amountBase,
        baseCurrency?.code || "XOF",
        amountBase,
        selectedCategory.id,
        note.trim() || null,
        "expense",
        null
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form
      setAmount("");
      setNote("");
      setSelectedCategory(expenseCategories[0] || null);

      Alert.alert(
        t("add.success") || "Success",
        t("add.expenseAdded") || "Expense added successfully"
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("common.error") || "Error",
        t("add.saveError") || "Failed to save expense. Please try again."
      );
    }
  };

  const canSubmit = amount && parseFloat(amount) > 0 && selectedCategory;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: scaleSpacing(24),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="max-w-md w-full self-center">
          {/* Title */}
          <Text
            className="text-2xl font-bold text-center mb-8"
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(24),
            }}
          >
            {t("add.title", "Add Expense")}
          </Text>

          {/* Amount Input */}
          <View style={{ marginBottom: scaleSpacing(28) }}>
            <Text
              style={{
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
                fontWeight: "600",
              }}
            >
              {t("add.amount", "Amount")}
            </Text>
            <View
              style={{
                borderRadius: scaleSpacing(12),
                paddingHorizontal: scaleSpacing(16),
                paddingVertical: scaleSpacing(14),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
                borderWidth: 1.5,
                flexDirection: "row",
                alignItems: "center",
                gap: scaleSpacing(12),
              }}
            >
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                  fontWeight: "600",
                }}
              >
                {baseCurrency?.symbol || baseCurrency?.code || ""}
              </Text>
              <TextInput
                style={{
                  flex: 1,
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                }}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
            {errors.amount && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: scaleFont(13),
                  marginTop: scaleSpacing(6),
                  fontWeight: "500",
                }}
              >
                {errors.amount}
              </Text>
            )}
          </View>

          {/* Category Selector */}
          <View style={{ marginBottom: scaleSpacing(28) }}>
            <Text
              style={{
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
                fontWeight: "600",
              }}
            >
              {t("add.category", "Category")}
            </Text>
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
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: scaleFont(16),
                          fontWeight: "600",
                        }}
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
                      {t("add.selectCategory", "Select a category")}
                    </Text>
                  )}
                  <Ionicons
                    name="chevron-down"
                    size={scaleSize(20)}
                    color={isDark ? "#9CA3AF" : "#9CA3AF"}
                  />
                </View>
              )}
            </Pressable>
            {errors.categoryId && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: scaleFont(13),
                  marginTop: scaleSpacing(6),
                  fontWeight: "500",
                }}
              >
                {errors.categoryId}
              </Text>
            )}

            {/* Category Selection Modal */}
            <Modal
              visible={showCategoryModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowCategoryModal(false)}
            >
              <Pressable
                className="flex-1"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
                onPress={() => setShowCategoryModal(false)}
              >
                <Pressable
                  onPress={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    maxHeight: "70%",
                  }}
                >
                  <View
                    className="rounded-t-3xl"
                    style={{
                      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                      paddingTop: scaleSpacing(20),
                      paddingBottom: scaleSpacing(30),
                      paddingHorizontal: scaleSpacing(20),
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-4">
                      <Text
                        className="text-xl font-bold"
                        style={{
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: scaleFont(20),
                        }}
                      >
                        {t("add.selectCategory", "Select a category")}
                      </Text>
                      <Pressable
                        onPress={() => setShowCategoryModal(false)}
                        className="p-2"
                      >
                        <Ionicons
                          name="close"
                          size={scaleSize(24)}
                          color={isDark ? "#FFFFFF" : "#111827"}
                        />
                      </Pressable>
                    </View>

                    {expenseCategories.length > 0 ? (
                      <FlatList
                        data={expenseCategories}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                          const isSelected = selectedCategory?.id === item.id;
                          return (
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                                setSelectedCategory(item);
                                setShowCategoryModal(false);
                              }}
                              className="mb-3"
                            >
                              {({ pressed }) => (
                                <View
                                  className="rounded-2xl p-4 flex-row items-center border-2"
                                  style={{
                                    backgroundColor: isSelected
                                      ? item.color + "15"
                                      : isDark
                                        ? "#374151"
                                        : "#F9FAFB",
                                    borderColor: isSelected
                                      ? item.color
                                      : isDark
                                        ? "#4B5563"
                                        : "#E5E7EB",
                                    borderWidth: isSelected ? 2 : 1.5,
                                    opacity: pressed ? 0.8 : 1,
                                  }}
                                >
                                  <View
                                    className="rounded-xl p-3 mr-3"
                                    style={{
                                      backgroundColor: item.color + "20",
                                    }}
                                  >
                                    <Ionicons
                                      name={item.icon as any}
                                      size={scaleSize(28)}
                                      color={item.color}
                                    />
                                  </View>
                                  <Text
                                    className="flex-1 font-semibold"
                                    style={{
                                      color: isSelected
                                        ? item.color
                                        : isDark
                                          ? "#FFFFFF"
                                          : "#111827",
                                      fontSize: scaleFont(16),
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
                                </View>
                              )}
                            </Pressable>
                          );
                        }}
                      />
                    ) : (
                      <View
                        className="p-6 rounded-2xl items-center justify-center"
                        style={{
                          backgroundColor: isDark ? "#374151" : "#F9FAFB",
                        }}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={scaleSize(32)}
                          color={isDark ? "#6B7280" : "#9CA3AF"}
                        />
                        <Text
                          className="text-sm mt-3 text-center"
                          style={{
                            color: isDark ? "#9CA3AF" : "#6B7280",
                            fontSize: scaleFont(14),
                          }}
                        >
                          {t("add.noCategories", "No expense categories available")}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          </View>

          {/* Note Input */}
          <View style={{ marginBottom: scaleSpacing(28) }}>
            <Text
              style={{
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
                fontWeight: "600",
              }}
            >
              {t("add.note", "Note")} {t("add.optional", "(Optional)")}
            </Text>
            <TextInput
              style={{
                borderRadius: scaleSpacing(12),
                paddingHorizontal: scaleSpacing(16),
                paddingVertical: scaleSpacing(14),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderColor: errors.note
                  ? "#EF4444"
                  : isDark
                    ? "#4B5563"
                    : "#E5E7EB",
                borderWidth: 1.5,
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(16),
                minHeight: scaleSize(100),
                textAlignVertical: "top",
              }}
              value={note}
              onChangeText={handleNoteChange}
              placeholder={t("add.notePlaceholder", "Add a note...")}
              placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
              multiline
              maxLength={300}
              returnKeyType="done"
            />
            {errors.note && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: scaleFont(13),
                  marginTop: scaleSpacing(6),
                  fontWeight: "500",
                }}
              >
                {errors.note}
              </Text>
            )}
            <Text
              style={{
                color: isDark ? "#6B7280" : "#9CA3AF",
                fontSize: scaleFont(12),
                marginTop: scaleSpacing(4),
                textAlign: "right",
              }}
            >
              {note.length}/300
            </Text>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.5 }}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={["#EF4444", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-3xl p-5 items-center justify-center"
                style={{
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: "#FFFFFF", fontSize: scaleFont(18) }}
                >
                  {t("add.save", "Save Expense")}
                </Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
