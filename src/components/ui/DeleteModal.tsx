import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
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
import { useTheme } from "../../state/ThemeProvider";
import { useResponsive } from "../../utils/responsive";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function DeleteModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  isLoading = false,
}: DeleteModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();

  // Calculate sheet height - smaller for delete modal
  const sheetHeight = 280;
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
            if (!isLoading) {
              onClose();
            }
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
    [sheetHeight, onClose, isLoading]
  );

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error in delete confirmation:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isLoading ? undefined : onClose}
        />
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
            {/* Title */}
            <Text
              style={{
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(20),
                fontWeight: "700",
                marginBottom: scaleSpacing(12),
                textAlign: "center",
              }}
            >
              {title}
            </Text>

            {/* Message */}
            <Text
              style={{
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(24),
                textAlign: "center",
                lineHeight: scaleFont(22),
              }}
            >
              {message}
            </Text>

            {/* Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: scaleSpacing(12),
              }}
            >
              {/* Cancel Button */}
              <Pressable
                onPress={isLoading ? undefined : onClose}
                disabled={isLoading}
                style={{
                  flex: 1,
                  borderRadius: scaleSpacing(12),
                  paddingVertical: scaleSpacing(16),
                  backgroundColor: isDark ? "#374151" : "#F3F4F6",
                  borderWidth: 1.5,
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
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

              {/* Delete Button */}
              <Pressable
                onPress={handleConfirm}
                disabled={isLoading}
                style={{
                  flex: 1,
                  borderRadius: scaleSpacing(12),
                  paddingVertical: scaleSpacing(16),
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scaleSpacing(6),
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={scaleSize(18)}
                      color="#FFFFFF"
                    />
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: scaleFont(16),
                        fontWeight: "600",
                      }}
                    >
                      {confirmLabel || t("common.delete", "Delete")}
                    </Text>
                  </View>
                )}
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

