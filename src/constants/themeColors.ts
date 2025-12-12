/**
 * Centralized Theme Colors System
 * All colors used in the app should be defined here
 * This ensures consistency and makes theming easier
 */

export const ThemeColors = {
  light: {
    // Background colors
    background: '#F8FAFC', // Slate 50 - Soft, airy
    surface: '#FFFFFF',    // White
    surfaceSecondary: '#F1F5F9', // Slate 100

    // Text colors
    text: '#334155',       // Slate 700 - Softer than black
    textPrimary: '#334155',
    textSecondary: '#64748B', // Slate 500
    textTertiary: '#94A3B8',  // Slate 400
    textInverse: '#F8FAFC',

    // Border colors
    border: '#E2E8F0',     // Slate 200
    borderLight: '#F1F5F9', // Slate 100
    borderDark: '#CBD5E1',  // Slate 300

    // Semantic colors
    primary: '#6366F1',     // Indigo 500 - Calming but active
    primaryLight: '#818CF8', // Indigo 400
    primaryDark: '#4F46E5',  // Indigo 600

    secondary: '#10B981',   // Emerald 500 - Peaceful Green
    secondaryLight: '#34D399',

    // Status colors
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',

    error: '#F43F5E',       // Rose 500 - Less aggressive than pure red
    errorLight: '#FB7185',
    errorDark: '#E11D48',

    warning: '#F59E0B',     // Amber 500
    warningLight: '#FBBF24',
    warningDark: '#D97706',

    info: '#3B82F6',        // Blue 500
    infoLight: '#60A5FA',
    infoDark: '#2563EB',

    // Special colors
    overlay: 'rgba(15, 23, 42, 0.5)', // Slate 900 with opacity
    shadow: 'rgba(15, 23, 42, 0.08)', // Soft slate shadow

    // Gradient colors
    gradients: {
      primary: ['#6366F1', '#4F46E5'],
      secondary: ['#10B981', '#059669'],
      success: ['#10B981', '#059669'],
      error: ['#F43F5E', '#E11D48'],
      warning: ['#F59E0B', '#D97706'],
      income: ['#10B981', '#059669'],
      expense: ['#F43F5E', '#E11D48'],
      wallet: ['#6366F1', '#8B5CF6'],
    },
  },
  dark: {
    // Background colors
    background: '#0F172A', // Slate 900 - Deep Midnight, restful
    surface: '#1E293B',    // Slate 800
    surfaceSecondary: '#334155', // Slate 700

    // Text colors
    text: '#F1F5F9',       // Slate 100 - Soft white
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8', // Slate 400
    textTertiary: '#64748B',  // Slate 500
    textInverse: '#0F172A',

    // Border colors
    border: '#334155',     // Slate 700
    borderLight: '#1E293B', // Slate 800
    borderDark: '#475569',  // Slate 600

    // Semantic colors
    primary: '#818CF8',     // Indigo 400 - Lighter for dark mode
    primaryLight: '#A5B4FC', // Indigo 300
    primaryDark: '#6366F1',  // Indigo 500

    secondary: '#34D399',   // Emerald 400
    secondaryLight: '#6EE7B7',

    // Status colors
    success: '#34D399',     // Emerald 400
    successLight: '#6EE7B7',
    successDark: '#10B981',

    error: '#FB7185',       // Rose 400
    errorLight: '#FDA4AF',
    errorDark: '#F43F5E',

    warning: '#FBBF24',     // Amber 400
    warningLight: '#FCD34D',
    warningDark: '#F59E0B',

    info: '#60A5FA',        // Blue 400
    infoLight: '#93C5FD',
    infoDark: '#3B82F6',

    // Special colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',

    // Gradient colors
    gradients: {
      primary: ['#818CF8', '#6366F1'],
      secondary: ['#34D399', '#10B981'],
      success: ['#34D399', '#10B981'],
      error: ['#FB7185', '#F43F5E'],
      warning: ['#FBBF24', '#F59E0B'],
      income: ['#34D399', '#10B981'],
      expense: ['#FB7185', '#F43F5E'],
      wallet: ['#818CF8', '#6366F1'],
    },
  },
} as const;

export type ThemeColorScheme = keyof typeof ThemeColors;
export type ThemeColors = typeof ThemeColors.light | typeof ThemeColors.dark;

