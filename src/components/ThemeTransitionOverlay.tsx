import { ThemeColors } from '@/src/constants/themeColors';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface ThemeTransitionOverlayProps {
  isAnimating: boolean;
  startPosition: { x: number; y: number } | null;
  newTheme: 'light' | 'dark';
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Calculate diagonal distance to ensure full screen coverage
const MAX_RADIUS = Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2);

export function ThemeTransitionOverlay({
  isAnimating,
  startPosition,
  newTheme,
  onComplete,
}: ThemeTransitionOverlayProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (isAnimating && startPosition) {
      // Start animation
      scale.value = 0;
      scale.value = withTiming(
        1,
        {
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        }
      );
    }
  }, [isAnimating, startPosition, onComplete]);

  if (!isAnimating || !startPosition) {
    return null;
  }

  const backgroundColor =
    newTheme === 'dark'
      ? ThemeColors.dark.background
      : ThemeColors.light.background;

  // Use simple animated view with expanding circle
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor,
          transform: [
            { translateX: startPosition.x },
            { translateY: startPosition.y },
            { scale: scale },
            { translateX: -startPosition.x },
            { translateY: -startPosition.y },
          ],
        },
      ]}
      pointerEvents="none"
    />
  );
}
