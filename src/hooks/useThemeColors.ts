/**
 * Hook to access theme colors easily
 * This provides a convenient way to get theme-aware colors
 * 
 * @example
 * const colors = useThemeColors();
 * <View style={{ backgroundColor: colors.background, color: colors.text }} />
 */
import { useTheme } from "@/src/state/ThemeProvider";

export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}

