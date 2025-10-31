/**
 * Static list of available colors for category selection
 * Colors are chosen to be visually distinct and pleasant
 */
export const AVAILABLE_CATEGORY_COLORS = [
  "#FF7043", // Orange-Red
  "#42A5F5", // Blue
  "#66BB6A", // Green
  "#FFA726", // Orange
  "#AB47BC", // Purple
  "#EF5350", // Red
  "#26A69A", // Teal
  "#5C6BC0", // Indigo
  "#FFCA28", // Amber
  "#EC407A", // Pink
  "#78909C", // Blue Grey
  "#8D6E63", // Brown
  "#AED581", // Light Green
  "#F48FB1", // Light Pink
  "#90CAF9", // Light Blue
  "#CE93D8", // Light Purple
] as const;

export type CategoryColor = (typeof AVAILABLE_CATEGORY_COLORS)[number];
