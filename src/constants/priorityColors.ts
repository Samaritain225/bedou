/**
 * Priority level for planned purchases
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Priority color mapping for planned purchases
 * High priority = Red, Medium = Orange, Low = Green
 */
export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
} as const;

