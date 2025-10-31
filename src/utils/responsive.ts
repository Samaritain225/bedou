import { useWindowDimensions } from "react-native";

/**
 * Responsive utility for scaling values based on screen size
 * Uses a base width of 375 (iPhone X/11/12 standard) as reference
 */

const BASE_WIDTH = 375;
const TABLET_BREAKPOINT = 768;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= TABLET_BREAKPOINT;
  const scale = width / BASE_WIDTH;

  /**
   * Scale a value proportionally based on screen width
   * @param size - Base size in pixels
   * @param maxScale - Maximum scale factor (default: 1.5)
   */
  const scaleSize = (size: number, maxScale: number = 1.5): number => {
    const scaled = size * scale;
    return Math.min(scaled, size * maxScale);
  };

  /**
   * Get responsive font size
   * Scales more conservatively for text readability
   */
  const scaleFont = (size: number, maxScale: number = 1.3): number => {
    const scaled = size * Math.min(scale, 1.2); // Cap at 20% increase
    return Math.min(scaled, size * maxScale);
  };

  /**
   * Get responsive padding/spacing
   */
  const scaleSpacing = (size: number, maxScale: number = 1.4): number => {
    const scaled = size * Math.min(scale, 1.15);
    return Math.min(scaled, size * maxScale);
  };

  /**
   * Get number of columns for grid layouts based on screen width
   */
  const getColumns = (phoneColumns: number): number => {
    if (width < 600) return phoneColumns;
    if (width < 900) return phoneColumns + 1;
    return phoneColumns + 2;
  };

  return {
    width,
    height,
    isTablet,
    scale,
    scaleSize,
    scaleFont,
    scaleSpacing,
    getColumns,
  };
}

/**
 * Hook for responsive layout calculations
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isSmallScreen: width < 375,
    isMediumScreen: width >= 375 && width < 768,
    isLargeScreen: width >= 768,
  };
}
