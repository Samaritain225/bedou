/**
 * Static list of available Ionicons for category selection
 * These are commonly used icons for expense and income tracking
 */
export const AVAILABLE_CATEGORY_ICONS = [
  // Shopping & Food
  "cart",
  "restaurant",
  "fast-food",
  "wine",
  "cafe",
  "storefront",

  // Transportation
  "car",
  "bus",
  "train",
  "airplane",
  "bicycle",
  "walk",
  "subway",

  // Housing & Utilities
  "home",
  "home-outline",
  "flash",
  "water",
  "snow",
  "wifi",
  "tv",

  // Personal & Health
  "medical",
  "fitness",
  "cut",
  "shirt",
  "school",
  "book",
  "library",

  // Entertainment & Leisure
  "musical-notes",
  "film",
  "game-controller",
  "football",
  "basketball",
  "tennisball",
  "gift",

  // Finance & Business
  "wallet",
  "card",
  "cash",
  "trending-up",
  "briefcase",
  "business",
  "stats-chart",

  // Communication & Tech
  "phone-portrait",
  "laptop",
  "phone-portrait-outline",
  "tablet-portrait",
  "desktop",
  "cloud",

  // Travel & Vacation
  "airplane-outline",
  "bed",
  "map",
  "compass",
  "camera",
  "images",

  // Family & Kids
  "people",
  "person",
  "heart",
  "heart-outline",
  "flower",
  "leaf",

  // Bills & Services
  "receipt",
  "document",
  "calendar",
  "time",
  "mail",
  "call",

  // Miscellaneous
  "star",
  "star-outline",
  "flag",
  "pricetag",
  "key",
  "lock-closed",
  "shield",
  "build",
  "settings",
  "help-circle",
  "information-circle",
  "checkmark-circle",
  "add-circle",
  "remove-circle",
] as const;

export type CategoryIconName = (typeof AVAILABLE_CATEGORY_ICONS)[number];
