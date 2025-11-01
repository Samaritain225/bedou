import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Category } from "../../features/categories/types";
import { Transaction } from "../../features/transactions/types";
import { useCurrency } from "../../state/CurrencyProvider";
import { useTheme } from "../../state/ThemeProvider";
import { useResponsive } from "../../utils/responsive";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TransactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  category: Category | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionDetailsModal({
  visible,
  onClose,
  transaction,
  category,
  onEdit,
  onDelete,
}: TransactionDetailsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const { baseCurrency } = useCurrency();

  // Calculate sheet height
  const sheetHeight = SCREEN_HEIGHT * 0.6;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const currentPosition = useRef(sheetHeight);

  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetHeight);
      currentPosition.current = sheetHeight;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        currentPosition.current = 0;
      });
    } else {
      currentPosition.current = sheetHeight;
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, sheetHeight]);

  const panResponder = useMemo(
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
          const threshold = sheetHeight * 0.3;

          if (
            currentY > threshold ||
            (velocity > 500 && gestureState.dy > 50)
          ) {
            onClose();
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
    [sheetHeight, onClose]
  );

  if (!transaction) return null;

  const formatAmount = (amountBase: number): string => {
    const amount = amountBase / 100;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateISO: string): string => {
    const date = new Date(dateISO);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isExpense = transaction.type === "expense";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            isDark && styles.sheetDark,
            {
              height: sheetHeight,
              transform: [{ translateY }],
              paddingBottom: Math.max(scaleSpacing(30), insets.bottom),
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle */}
          <View
            style={[
              styles.dragHandle,
              isDark && styles.dragHandleDark,
              {
                marginTop: scaleSpacing(10),
                marginBottom: scaleSpacing(8),
              },
            ]}
          />

          {/* Content */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: scaleSpacing(20),
              paddingTop: scaleSpacing(16),
            }}
          >
            {/* Close Button */}
            <Pressable
              onPress={onClose}
              style={{
                alignSelf: "flex-end",
                padding: scaleSpacing(8),
                marginBottom: scaleSpacing(12),
              }}
            >
              <Ionicons
                name="close"
                size={scaleSize(24)}
                color={isDark ? "#FFFFFF" : "#111827"}
              />
            </Pressable>

            {/* Transaction Info */}
            <View
              style={{
                alignItems: "center",
                marginBottom: scaleSpacing(24),
              }}
            >
              {/* Category Icon */}
              {category ? (
                <View
                  style={{
                    borderRadius: scaleSpacing(16),
                    padding: scaleSpacing(16),
                    backgroundColor: category.color + "20",
                    marginBottom: scaleSpacing(16),
                  }}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={scaleSize(40)}
                    color={category.color}
                  />
                </View>
              ) : (
                <View
                  style={{
                    borderRadius: scaleSpacing(16),
                    padding: scaleSpacing(16),
                    backgroundColor: isDark ? "#4B5563" : "#F3F4F6",
                    marginBottom: scaleSpacing(16),
                  }}
                >
                  <Ionicons
                    name="ellipse-outline"
                    size={scaleSize(40)}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </View>
              )}

              {/* Amount */}
              <Text
                style={{
                  color: isExpense ? "#EF4444" : "#10B981",
                  fontSize: scaleFont(32),
                  fontWeight: "700",
                  marginBottom: scaleSpacing(8),
                }}
              >
                {isExpense ? "-" : "+"}
                {formatAmount(transaction.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
              </Text>

              {/* Category Name */}
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(20),
                  fontWeight: "600",
                  marginBottom: scaleSpacing(4),
                }}
              >
                {category?.name || t("transactions.uncategorized", "Uncategorized")}
              </Text>
            </View>

            {/* Details */}
            <View
              style={{
                gap: scaleSpacing(16),
                marginBottom: scaleSpacing(24),
              }}
            >
              {/* Date/Time */}
              <View>
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(14),
                    fontWeight: "600",
                    marginBottom: scaleSpacing(6),
                  }}
                >
                  {t("transactions.date", "Date & Time")}
                </Text>
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(16),
                  }}
                >
                  {formatDateTime(transaction.dateISO)}
                </Text>
              </View>

              {/* Type */}
              <View>
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(14),
                    fontWeight: "600",
                    marginBottom: scaleSpacing(6),
                  }}
                >
                  {t("transactions.type", "Type")}
                </Text>
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(16),
                    textTransform: "capitalize",
                  }}
                >
                  {transaction.type}
                </Text>
              </View>

              {/* Note */}
              {transaction.note && (
                <View>
                  <Text
                    style={{
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      fontSize: scaleFont(14),
                      fontWeight: "600",
                      marginBottom: scaleSpacing(6),
                    }}
                  >
                    {t("transactions.note", "Note")}
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontSize: scaleFont(16),
                    }}
                  >
                    {transaction.note}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View
              style={{
                flexDirection: "row",
                gap: scaleSpacing(12),
              }}
            >
              {/* Edit Button */}
              <Pressable
                onPress={onEdit}
                style={{
                  flex: 1,
                  borderRadius: scaleSpacing(12),
                  paddingVertical: scaleSpacing(16),
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                  borderWidth: 1.5,
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: scaleSpacing(8),
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={scaleSize(20)}
                  color={isDark ? "#FFFFFF" : "#111827"}
                />
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(16),
                    fontWeight: "600",
                  }}
                >
                  {t("transactions.edit", "Edit")}
                </Text>
              </Pressable>

              {/* Delete Button */}
              <Pressable
                onPress={onDelete}
                style={{
                  flex: 1,
                  borderRadius: scaleSpacing(12),
                  paddingVertical: scaleSpacing(16),
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: scaleSpacing(8),
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={scaleSize(20)}
                  color="#FFFFFF"
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scaleFont(16),
                    fontWeight: "600",
                  }}
                >
                  {t("transactions.delete", "Delete")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetDark: {
    backgroundColor: "#1F2937",
    shadowColor: "#000",
  },
  dragHandle: {
    width: 56,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
  },
  dragHandleDark: {
    backgroundColor: "#4B5563",
  },
});

