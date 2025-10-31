import React, { ReactNode, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: number[]; // Array of heights (0-1 representing percentage of screen)
  initialSnapPoint?: number; // Initial snap point index
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [0.5, 0.9],
  initialSnapPoint = 0,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const currentSnapIndex = React.useRef(initialSnapPoint);
  const currentPosition = React.useRef(SCREEN_HEIGHT);

  const getSnapPoint = (index: number) => {
    const point = snapPoints[index];
    return point <= 1 ? SCREEN_HEIGHT * (1 - point) : SCREEN_HEIGHT - point;
  };

  useEffect(() => {
    if (visible) {
      // Reset to initial snap point when opening
      currentSnapIndex.current = initialSnapPoint;
      const targetY = getSnapPoint(currentSnapIndex.current);
      currentPosition.current = targetY;
      // Set initial position immediately
      translateY.setValue(targetY);
      // Then animate
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      currentPosition.current = SCREEN_HEIGHT;
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialSnapPoint]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderMove: (_, gestureState) => {
          const startY = getSnapPoint(currentSnapIndex.current);
          const newY = startY + gestureState.dy;
          if (newY >= 0 && newY <= SCREEN_HEIGHT) {
            currentPosition.current = newY;
            translateY.setValue(newY);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const velocity = gestureState.vy;
          const currentY = currentPosition.current;
          const currentSnap = getSnapPoint(currentSnapIndex.current);

          // Determine which snap point to go to
          let targetSnapIndex = currentSnapIndex.current;

          if (Math.abs(velocity) > 500 || Math.abs(gestureState.dy) > 100) {
            if (velocity > 0 || gestureState.dy > 0) {
              // Dragging down
              if (currentSnapIndex.current > 0) {
                targetSnapIndex = currentSnapIndex.current - 1;
              } else {
                // Close if at first snap point and dragging down
                onClose();
                return;
              }
            } else if (currentSnapIndex.current < snapPoints.length - 1) {
              // Dragging up
              targetSnapIndex = currentSnapIndex.current + 1;
            }
          } else {
            // Find closest snap point
            let minDistance = Infinity;
            for (let index = 0; index < snapPoints.length; index++) {
              const snapY = getSnapPoint(index);
              const distance = Math.abs(currentY - snapY);
              if (distance < minDistance) {
                minDistance = distance;
                targetSnapIndex = index;
              }
            }
          }

          currentSnapIndex.current = targetSnapIndex;

          Animated.spring(translateY, {
            toValue: getSnapPoint(targetSnapIndex),
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        },
      }),
    [snapPoints, onClose]
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
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle */}
          <Pressable
            style={styles.dragHandleContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dragHandle} />
          </Pressable>
          <Pressable onPress={(e) => e.stopPropagation()}>{children}</Pressable>
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.95,
    minHeight: 200,
    width: "100%",
  },
  dragHandleContainer: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
  },
});
