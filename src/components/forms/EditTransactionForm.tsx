import { FormField } from "@/src/components/ui/FormField";
import { TextInputField } from "@/src/components/ui/TextInputField";
import { useDb } from "@/src/db/hooks";
import { Category } from "@/src/features/categories/types";
import { updateTransaction } from "@/src/features/transactions/repository";
import { Transaction } from "@/src/features/transactions/types";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useWallet } from "@/src/state/WalletProvider";
import { handleAmountChange } from "@/src/utils/formHelpers";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const transactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  note: z
    .string()
    .max(300, "Note must be less than 300 characters")
    .optional()
    .nullable(),
});

interface EditTransactionFormProps {
  initialTransaction: Transaction;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditTransactionForm({
  initialTransaction,
  onClose,
  onSuccess,
}: EditTransactionFormProps) {
  const { t } = useTranslation();
  const db = useDb();
  const { categories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { adjustWalletBalance } = useWallet();
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  // Initialize form with transaction data
  const initialAmount = (initialTransaction.amountBase / 100).toString();
  const initialCategory = categories.find(
    (cat) => cat.id === initialTransaction.categoryId
  ) || null;

  const [amount, setAmount] = useState(initialAmount);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    initialCategory
  );
  const [note, setNote] = useState(initialTransaction.note || "");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [errors, setErrors] = useState<{
    amount?: string;
    categoryId?: string;
    note?: string;
  }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Bottom sheet animation for category modal
  const { height: SCREEN_HEIGHT } = Dimensions.get("window");
  const modalSheetHeight = SCREEN_HEIGHT * 0.7;
  const translateY = React.useRef(new Animated.Value(modalSheetHeight)).current;
  const currentPosition = React.useRef(modalSheetHeight);

  React.useEffect(() => {
    if (showCategoryModal) {
      translateY.setValue(modalSheetHeight);
      currentPosition.current = modalSheetHeight;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        currentPosition.current = 0;
      });
    } else {
      currentPosition.current = modalSheetHeight;
      Animated.timing(translateY, {
        toValue: modalSheetHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showCategoryModal, modalSheetHeight]);

  const categoryModalPanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            const newY = gestureState.dy;
            currentPosition.current = newY;
            translateY.setValue(newY);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const velocity = gestureState.vy;
          const currentY = currentPosition.current;
          const threshold = modalSheetHeight * 0.3;

          if (
            currentY > threshold ||
            (velocity > 500 && gestureState.dy > 50)
          ) {
            setShowCategoryModal(false);
          } else {
            currentPosition.current = 0;
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          }
        },
      }),
    [modalSheetHeight]
  );

  // Filter categories based on transaction type
  const transactionCategories = categories.filter(
    (cat) => cat.type === initialTransaction.type
  );

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) {
      return transactionCategories;
    }
    const query = categorySearchQuery.toLowerCase().trim();
    return transactionCategories.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );
  }, [transactionCategories, categorySearchQuery]);

  const handleCreateCategory = () => {
    setShowCategoryModal(false);
    setCategorySearchQuery("");
    router.push("/(tabs)/categories?openAdd=true");
  };

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
      const result = transactionSchema.safeParse({
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

      // Update transaction
      const updatedTransaction: Transaction = {
        ...initialTransaction,
        amountBase,
        amountOriginal: amountBase,
        categoryId: selectedCategory.id,
        note: note.trim() || null,
      };

      await updateTransaction(updatedTransaction, db);

      // Adjust wallet: reverse old transaction effect, apply new transaction effect
      // If expense was deducted, we add it back; if income was added, we deduct it
      const oldAmountDelta = initialTransaction.type === "expense" 
        ? initialTransaction.amountBase  // Reverse expense: add back
        : -initialTransaction.amountBase; // Reverse income: deduct
      // Then apply the new transaction effect
      const newAmountDelta = initialTransaction.type === "expense"
        ? -updatedTransaction.amountBase  // Apply expense: deduct
        : updatedTransaction.amountBase;  // Apply income: add
      
      // First reverse the old transaction
      await adjustWalletBalance(oldAmountDelta, baseCurrency?.code || "XOF");
      // Then apply the new transaction
      await adjustWalletBalance(newAmountDelta, baseCurrency?.code || "XOF");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500); // Close after 1.5 seconds
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGeneralError(t("add.saveError") || "Failed to update transaction. Please try again.");
      setTimeout(() => {
        setGeneralError(null);
      }, 5000);
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
          padding: scaleSpacing(24),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="max-w-md w-full self-center">
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
              {t("transactions.edit", "Edit Transaction")}
            </Text>
            <Pressable onPress={onClose} style={{ padding: scaleSpacing(8) }}>
              <Ionicons
                name="close"
                size={scaleSize(24)}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </Pressable>
          </View>

          {/* Success Message */}
          {showSuccess && (
            <Animated.View
              style={{
                marginBottom: scaleSpacing(16),
                paddingVertical: scaleSpacing(12),
                paddingHorizontal: scaleSpacing(16),
                backgroundColor: "#10B981",
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
                {t("transactions.updated", "Transaction updated successfully")}
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
                backgroundColor: "#EF4444",
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
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderColor: errors.amount
                  ? "#EF4444"
                  : isDark
                    ? "#4B5563"
                    : "#E5E7EB",
                borderWidth: errors.amount ? 1.5 : 1.5,
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
                onChangeText={onAmountChange}
                placeholder="0"
                placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
          </FormField>

          {/* Category Selector */}
          <FormField label={t("add.category", "Category")} error={errors.categoryId}>
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

            {/* Category Selection Modal */}
            <Modal
              visible={showCategoryModal}
              transparent
              animationType="none"
              onRequestClose={() => setShowCategoryModal(false)}
              statusBarTranslucent
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  justifyContent: "flex-end",
                }}
              >
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setShowCategoryModal(false)}
                />
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <Animated.View
                    style={{
                      borderTopLeftRadius: scaleSpacing(28),
                      borderTopRightRadius: scaleSpacing(28),
                      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                      width: "100%",
                      maxHeight: modalSheetHeight,
                      height: modalSheetHeight,
                      transform: [{ translateY }],
                      paddingBottom: insets.bottom,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: -2,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                      elevation: 12,
                    }}
                    {...categoryModalPanResponder.panHandlers}
                  >
                  {/* Drag Handle */}
                  <View
                    style={{
                      width: scaleSize(56),
                      height: scaleSize(4),
                      backgroundColor: isDark ? "#4B5563" : "#D1D5DB",
                      borderRadius: scaleSize(2),
                      alignSelf: "center",
                      marginTop: scaleSpacing(10),
                      marginBottom: scaleSpacing(8),
                    }}
                  />
                  
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: scaleSpacing(20),
                      marginBottom: scaleSpacing(16),
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? "#FFFFFF" : "#111827",
                        fontSize: scaleFont(20),
                        fontWeight: "700",
                        letterSpacing: 0.3,
                      }}
                    >
                      {t("add.selectCategory", "Select a category")}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setShowCategoryModal(false);
                        setCategorySearchQuery("");
                      }}
                      style={{
                        padding: scaleSpacing(8),
                        borderRadius: scaleSpacing(8),
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={scaleSize(24)}
                        color={isDark ? "#FFFFFF" : "#111827"}
                      />
                    </Pressable>
                  </View>

                  {/* Search Input */}
                  <View
                    style={{
                      paddingHorizontal: scaleSpacing(20),
                      marginBottom: scaleSpacing(16),
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: scaleSpacing(12),
                        paddingHorizontal: scaleSpacing(16),
                        paddingVertical: scaleSpacing(10),
                        backgroundColor: isDark ? "#374151" : "#FFFFFF",
                        borderColor: isDark ? "#4B5563" : "#E5E7EB",
                        borderWidth: 1.5,
                        gap: scaleSpacing(12),
                      }}
                    >
                      <Ionicons
                        name="search"
                        size={scaleSize(20)}
                        color={isDark ? "#9CA3AF" : "#9CA3AF"}
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: scaleFont(16),
                        }}
                        value={categorySearchQuery}
                        onChangeText={setCategorySearchQuery}
                        placeholder={t("add.searchCategory", "Search categories...") || "Search categories..."}
                        placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {categorySearchQuery.length > 0 && (
                        <Pressable
                          onPress={() => setCategorySearchQuery("")}
                          style={{
                            padding: scaleSpacing(4),
                          }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={scaleSize(20)}
                            color={isDark ? "#9CA3AF" : "#9CA3AF"}
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {filteredCategories.length > 0 ? (
                    <FlatList
                      data={filteredCategories}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingHorizontal: scaleSpacing(20),
                        paddingBottom: scaleSpacing(20),
                      }}
                      ListFooterComponent={
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleCreateCategory();
                          }}
                          style={{
                            marginTop: scaleSpacing(12),
                            marginBottom: scaleSpacing(8),
                            paddingVertical: scaleSpacing(14),
                            paddingHorizontal: scaleSpacing(16),
                            borderRadius: scaleSpacing(12),
                            backgroundColor: isDark ? "#374151" : "#F9FAFB",
                            borderColor: isDark ? "#4B5563" : "#E5E7EB",
                            borderWidth: 1.5,
                            borderStyle: "dashed",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: scaleSpacing(8),
                          }}
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={scaleSize(20)}
                            color={isDark ? "#9CA3AF" : "#6B7280"}
                          />
                          <Text
                            style={{
                              color: isDark ? "#9CA3AF" : "#6B7280",
                              fontSize: scaleFont(16),
                              fontWeight: "600",
                            }}
                          >
                            {t("add.createCategory", "Create New Category")}
                          </Text>
                        </Pressable>
                      }
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
                              setCategorySearchQuery("");
                            }}
                            style={{ marginBottom: scaleSpacing(12) }}
                          >
                            {({ pressed }) => (
                              <View
                                style={{
                                  borderRadius: scaleSpacing(12),
                                  paddingHorizontal: scaleSpacing(16),
                                  paddingVertical: scaleSpacing(14),
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
                                  flexDirection: "row",
                                  alignItems: "center",
                                  opacity: pressed ? 0.8 : 1,
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
                                    size={scaleSize(24)}
                                    color={item.color}
                                  />
                                </View>
                                <Text
                                  style={{
                                    flex: 1,
                                    color: isSelected
                                      ? item.color
                                      : isDark
                                        ? "#FFFFFF"
                                        : "#111827",
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
                              </View>
                            )}
                          </Pressable>
                        );
                      }}
                    />
                  ) : categorySearchQuery.trim() ? (
                    <View
                      style={{
                        padding: scaleSpacing(24),
                        borderRadius: scaleSpacing(12),
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDark ? "#374151" : "#F9FAFB",
                        marginHorizontal: scaleSpacing(20),
                      }}
                    >
                      <Ionicons
                        name="search-outline"
                        size={scaleSize(32)}
                        color={isDark ? "#6B7280" : "#9CA3AF"}
                      />
                      <Text
                        style={{
                          color: isDark ? "#9CA3AF" : "#6B7280",
                          fontSize: scaleFont(14),
                          marginTop: scaleSpacing(12),
                          textAlign: "center",
                          marginBottom: scaleSpacing(8),
                        }}
                      >
                        {t("add.noCategoryFound", "No category found for")} "{categorySearchQuery}"
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleCreateCategory();
                        }}
                        style={{
                          marginTop: scaleSpacing(16),
                          paddingVertical: scaleSpacing(12),
                          paddingHorizontal: scaleSpacing(24),
                          backgroundColor: "#2563eb",
                          borderRadius: scaleSpacing(12),
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: scaleFont(16),
                            fontWeight: "600",
                          }}
                        >
                          {t("add.createCategory", "Create New Category")}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View
                      style={{
                        padding: scaleSpacing(24),
                        borderRadius: scaleSpacing(12),
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDark ? "#374151" : "#F9FAFB",
                        marginHorizontal: scaleSpacing(20),
                      }}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={scaleSize(32)}
                        color={isDark ? "#6B7280" : "#9CA3AF"}
                      />
                      <Text
                        style={{
                          color: isDark ? "#9CA3AF" : "#6B7280",
                          fontSize: scaleFont(14),
                          marginTop: scaleSpacing(12),
                          textAlign: "center",
                        }}
                      >
                        {t("add.noCategories", "No categories available")}
                      </Text>
                    </View>
                  )}
                  </Animated.View>
                </Pressable>
              </View>
            </Modal>
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
                color: isDark ? "#6B7280" : "#9CA3AF",
                fontSize: scaleFont(12),
                marginTop: scaleSpacing(4),
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
                colors={canSubmit ? ["#2563EB", "#1D4ED8"] : isDark ? ["#4B5563", "#374151"] : ["#D1D5DB", "#9CA3AF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: scaleSpacing(12),
                  paddingVertical: scaleSpacing(16),
                  paddingHorizontal: scaleSpacing(20),
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: canSubmit ? "#2563EB" : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: canSubmit ? 4 : 0,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scaleFont(16),
                    fontWeight: "600",
                    letterSpacing: 0.2,
                  }}
                >
                  {t("transactions.save", "Save Changes")}
                </Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

