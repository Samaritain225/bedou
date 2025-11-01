import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../state/ThemeProvider";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SimpleBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SimpleBottomSheet({
  visible,
  onClose,
  children,
}: SimpleBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  // Calculate sheet height to be 90% of screen
  const sheetHeight = SCREEN_HEIGHT * 0.9;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const currentPosition = useRef(sheetHeight);

  useEffect(() => {
    if (visible) {
      // Start from below screen and animate up
      translateY.setValue(sheetHeight);
      currentPosition.current = sheetHeight;
      // Animate slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        // Update position after animation completes
        currentPosition.current = 0;
      });
    } else {
      // Animate slide down when closing
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
          // Only allow dragging down
          if (gestureState.dy > 0) {
            const newY = gestureState.dy;
            currentPosition.current = newY;
            translateY.setValue(newY);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const velocity = gestureState.vy;
          const currentY = currentPosition.current;
          const threshold = sheetHeight * 0.3; // Close if dragged more than 30% down

          // Close if dragged down enough or with sufficient velocity
          if (
            currentY > threshold ||
            (velocity > 500 && gestureState.dy > 50)
          ) {
            onClose();
          } else {
            // Snap back to top
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
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.sheet,
              isDark && styles.sheetDark,
              {
                height: sheetHeight,
                transform: [{ translateY }],
                paddingBottom: insets.bottom,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Drag Handle */}
            <View
              style={[styles.dragHandle, isDark && styles.dragHandleDark]}
            />

            {/* Content */}
            <KeyboardAvoidingView
              style={styles.keyboardAvoid}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <View style={styles.content} collapsable={false}>
                {children}
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </Pressable>
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
    marginTop: 10,
    marginBottom: 8,
  },
  dragHandleDark: {
    backgroundColor: "#4B5563",
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    minHeight: 0,
  },
});
