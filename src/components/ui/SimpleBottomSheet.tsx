import React from "react";
import { Dimensions, Modal, Pressable, StyleSheet, View } from "react-native";
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.sheet,
              isDark && styles.sheetDark,
              { height: sheetHeight },
            ]}
          >
            {/* Drag Handle */}
            <View
              style={[styles.dragHandle, isDark && styles.dragHandleDark]}
            />

            {/* Content */}
            <View style={[styles.content, { paddingBottom: insets.bottom }]}>
              {children}
            </View>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
});
