import { CurrencyAmountInput } from "@/src/components/ui/CurrencyAmountInput";
import { FormField } from "@/src/components/ui/FormField";
import { PrioritySelector } from "@/src/components/ui/PrioritySelector";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { TextInputField } from "@/src/components/ui/TextInputField";
import { Category } from "@/src/features/categories/types";
import { plannedPurchasesService } from "@/src/services/firestore/planned-purchases.service";
import { useAuth } from "@/src/state/AuthProvider";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { PlannedPurchaseDocument } from "@/src/types/firestore";
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

type Priority = PlannedPurchaseDocument["priority"];

interface PlannedPurchaseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialPurchase?: PlannedPurchaseDocument;
}

export function PlannedPurchaseForm({
  onSuccess,
  onCancel,
  initialPurchase,
}: PlannedPurchaseFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { categories } = useCategories();
  const { scaleSpacing, scaleSize, scaleFont, isTablet } = useResponsive();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const isEditing = !!initialPurchase;

  const [name, setName] = useState(initialPurchase?.name || "");
  const [amount, setAmount] = useState(
    initialPurchase ? (initialPurchase.amountBase / 100).toString() : ""
  );
  const [priority, setPriority] = useState<Priority>(
    initialPurchase?.priority || "medium"
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    initialPurchase?.categoryId
      ? categories.find((c) => c.id === initialPurchase.categoryId) || null
      : null
  );
  const [note, setNote] = useState(initialPurchase?.note || "");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    amount?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = useMemo(
    () => categories.filter((cat) => cat.type === "expense"),
    [categories]
  );

  const handleSubmit = async () => {
    if (!user) return;

    try {
      const numericAmount = parseFloat(amount);
      if (!name.trim()) {
        setErrors({ name: t("wishlist.nameRequired", "Name is required") });
        return;
      }
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrors({ amount: t("wishlist.amountRequired", "Please enter a valid amount") });
        return;
      }

      setErrors({});
      setIsSubmitting(true);

      const amountBase = Math.round(numericAmount * 100);

      if (isEditing && initialPurchase?.id) {
        // Update existing purchase
        await plannedPurchasesService.update(initialPurchase.id, {
            name: name.trim(),
            amountBase,
            priority,
            categoryId: selectedCategory?.id || undefined,
            note: note.trim() || undefined,
        });
      } else {
        // Add new purchase
        await plannedPurchasesService.create({
            userId: user.uid,
            name: name.trim(),
            amountBase,
            priority,
            categoryId: selectedCategory?.id || undefined,
            note: note.trim() || undefined,
            isPurchased: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form only if not editing
      if (!isEditing) {
        setName("");
        setAmount("");
        setPriority("medium");
        setSelectedCategory(null);
        setNote("");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error adding planned purchase:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ amount: t("wishlist.saveError", "Failed to save. Please try again.") });
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
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          padding: scaleSpacing(24),
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
          {/* Name Input */}
          <FormField label={t("wishlist.name", "Item Name")} error={errors.name}>
            <TextInputField
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder={t("wishlist.namePlaceholder", "What do you want to buy?")}
              error={!!errors.name}
            />
          </FormField>

          {/* Amount Input */}
          <FormField label={t("wishlist.amount", "Amount")} error={errors.amount}>
            <CurrencyAmountInput
              value={amount}
              onChangeText={onAmountChange}
              error={!!errors.amount}
            />
          </FormField>

          {/* Priority Selector */}
          <FormField label={t("wishlist.priority", "Priority")}>
            <PrioritySelector value={priority} onChange={setPriority} />
          </FormField>

          {/* Category Selector */}
          <FormField
            label={t("wishlist.category", "Category")}
            labelOptional
            labelOptionalText={t("common.optional", "(Optional)")}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCategoryModal(true);
              }}
            >
              <View
                style={{
                  borderRadius: scaleSpacing(12),
                  paddingHorizontal: scaleSpacing(16),
                  paddingVertical: scaleSpacing(14),
                  backgroundColor: isDark ? "#374151" : "#FFFFFF",
                  borderWidth: 1.5,
                  borderColor: selectedCategory
                    ? selectedCategory.color
                    : isDark
                      ? "#4B5563"
                      : "#E5E7EB",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSpacing(12) }}>
                  {selectedCategory ? (
                    <>
                      <Ionicons
                        name={selectedCategory.icon as any}
                        size={scaleSize(20)}
                        color={selectedCategory.color}
                      />
                      <Text
                        style={{
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: scaleFont(isTablet ? 18 : 16),
                          fontWeight: "500",
                        }}
                      >
                        {selectedCategory.name}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{
                        color: isDark ? "#9CA3AF" : "#6B7280",
                        fontSize: scaleFont(isTablet ? 18 : 16),
                      }}
                    >
                      {t("wishlist.selectCategory", "Select category")}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-down"
                  size={scaleSize(20)}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </View>
            </Pressable>
          </FormField>

          {/* Note Input */}
          <FormField
            label={t("wishlist.note", "Note")}
            labelOptional
            labelOptionalText={t("common.optional", "(Optional)")}
          >
            <TextInputField
              value={note}
              onChangeText={setNote}
              placeholder={t("wishlist.notePlaceholder", "Add a note...")}
              multiline
              maxLength={300}
            />
          </FormField>

          {/* Actions */}
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
                  borderRadius: scaleSpacing(12),
                  paddingVertical: scaleSpacing(16),
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
              disabled={isSubmitting || !name.trim() || !amount}
              style={{
                flex: 1,
                borderRadius: scaleSpacing(12),
                paddingVertical: scaleSpacing(16),
                backgroundColor:
                  isSubmitting || !name.trim() || !amount
                    ? isDark
                      ? "#4B5563"
                      : "#D1D5DB"
                    : isDark
                      ? "#3B82F6"
                      : "#2563EB",
                alignItems: "center",
                opacity: isSubmitting || !name.trim() || !amount ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: scaleFont(16),
                  fontWeight: "600",
                }}
              >
{isEditing
                  ? t("wishlist.update", "Update Wishlist Item")
                  : t("wishlist.add", "Add to Wishlist")}
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
        <View style={{ padding: scaleSpacing(20) }}>
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(20),
              fontWeight: "700",
              marginBottom: scaleSpacing(20),
            }}
          >
            {t("wishlist.selectCategory", "Select category")}
          </Text>
          <FlatList
            data={expenseCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedCategory?.id === item.id;
              return (
                <Pressable
                  onPress={() => {
                    setSelectedCategory(isSelected ? null : item);
                    setShowCategoryModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: scaleSpacing(16),
                    borderRadius: scaleSpacing(12),
                    marginBottom: scaleSpacing(8),
                    backgroundColor: isSelected
                      ? isDark
                        ? "#4B5563"
                        : "#F3F4F6"
                      : "transparent",
                    borderWidth: 1.5,
                    borderColor: isSelected
                      ? item.color
                      : isDark
                        ? "#4B5563"
                        : "#E5E7EB",
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
                      fontWeight: "600",
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
            ListEmptyComponent={
              <View
                style={{
                  padding: scaleSpacing(20),
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(14),
                  }}
                >
                  {t("add.noCategories", "No expense categories available")}
                </Text>
              </View>
            }
          />
        </View>
      </SimpleBottomSheet>
    </KeyboardAvoidingView>
  );
}

