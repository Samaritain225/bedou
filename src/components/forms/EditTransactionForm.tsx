import { FormField } from "@/src/components/ui/FormField";
import { TextInputField } from "@/src/components/ui/TextInputField";
// import { useDb } from "@/src/db/hooks"; // REMOVED
import { DatePicker } from "@/src/components/ui/DatePicker";
import { Category } from "@/src/features/categories/types";
import { createTransactionsService } from "@/src/services/firestore/transactions.service";
import { useAuth } from "@/src/state/AuthProvider";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useWallet } from "@/src/state/WalletProvider";
import { TransactionDocument } from "@/src/types/firestore";
import { handleAmountChange } from "@/src/utils/formHelpers";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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

interface EditTransactionFormProps {
  initialTransaction: TransactionDocument;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionForm({
  initialTransaction,
  onClose,
  onSuccess,
}: EditTransactionFormProps) {
  const { t } = useTranslation();
  // const db = useDb(); // REMOVED
  const { user } = useAuth();
  const { categories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { adjustWalletBalance } = useWallet();
  const { scaleSpacing, scaleSize, scaleFont, isTablet } = useResponsive();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState((initialTransaction.amountBase / 100).toString());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    initialTransaction.categoryId
      ? categories.find((c) => c.id === initialTransaction.categoryId) || null
      : null
  );
  const [note, setNote] = useState(initialTransaction.note || "");
  const [date, setDate] = useState(new Date(initialTransaction.dateISO));
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [errors, setErrors] = useState<{
    amount?: string;
    categoryId?: string;
    note?: string;
  }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bottom sheet animation for category modal
  const { height: SCREEN_HEIGHT } = Dimensions.get("window");
  const modalSheetHeight = SCREEN_HEIGHT * 0.7;
  const translateY = useRef(new Animated.Value(modalSheetHeight)).current;
  const currentPosition = useRef(modalSheetHeight);

  useEffect(() => {
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

  const categoryModalPanResponder = useMemo(
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
      const numericAmount = Number.parseFloat(amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        setErrors({ amount: t("add.amountRequired") || "Please enter a valid amount" });
        return;
      }

      if (!selectedCategory) {
        setErrors({ categoryId: t("add.categoryRequired") || "Please select a category" });
        return;
      }

      if (!initialTransaction.id) return;

      setErrors({});
      setIsSubmitting(true);

      const newAmountBase = Math.round(numericAmount * 100);
      const oldAmountBase = initialTransaction.amountBase;

      // Calculate balance adjustment
      let balanceAdjustment = 0;
      if (initialTransaction.type === "expense") {
        balanceAdjustment = oldAmountBase - newAmountBase;
      } else {
        balanceAdjustment = newAmountBase - oldAmountBase;
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      const transactionsService = createTransactionsService(user.uid);
      await transactionsService.update(initialTransaction.id, {
        amountBase: newAmountBase,
        categoryId: selectedCategory.id,
        note: note.trim() || undefined,
        dateISO: date.toISOString(),
      });

      if (balanceAdjustment !== 0) {
        await adjustWalletBalance(balanceAdjustment, initialTransaction.currencyCode);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating transaction:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGeneralError(t("add.saveError") || "Failed to update transaction. Please try again.");
      setTimeout(() => {
        setGeneralError(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = amount && Number.parseFloat(amount) > 0 && selectedCategory;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      enabled={Platform.OS === "ios"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          padding: scaleSpacing(24),
          paddingBottom: Math.max(insets.bottom, scaleSpacing(24)),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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

          {/* Date Picker */}
          <FormField label={t("add.date", "Date") || "Date"}>
            <DatePicker
              value={date}
              onChange={setDate}
            />
          </FormField>

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
          <FormField label={t("add.note", "Note")} error={errors.note}>
            <TextInputField
              value={note}
              onChangeText={handleNoteChange}
              placeholder={t("add.notePlaceholder", "Add a note...")}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
            <Text
              style={{
                textAlign: "right",
                fontSize: scaleFont(12),
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: scaleSpacing(4),
              }}
            >
              {note.length}/300
            </Text>
          </FormField>

          {/* Submit Button */}
          <View style={{ marginTop: scaleSpacing(24), marginBottom: scaleSpacing(40) }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSubmit();
              }}
              disabled={!canSubmit || isSubmitting}
              style={({ pressed }) => ({
                backgroundColor: !canSubmit || isSubmitting
                  ? isDark ? "#374151" : "#E5E7EB"
                  : isDark ? "#3B82F6" : "#2563EB",
                paddingVertical: scaleSpacing(16),
                borderRadius: scaleSpacing(16),
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.9 : 1,
                shadowColor: !canSubmit || isSubmitting ? "transparent" : (isDark ? "#3B82F6" : "#2563EB"),
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: !canSubmit || isSubmitting ? 0 : 0.3,
                shadowRadius: 8,
                elevation: !canSubmit || isSubmitting ? 0 : 8,
              })}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: !canSubmit || isSubmitting
                      ? isDark ? "#9CA3AF" : "#9CA3AF"
                      : "#FFFFFF",
                    fontSize: scaleFont(18),
                    fontWeight: "700",
                  }}
                >
                  {t("common.save", "Save Changes")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
