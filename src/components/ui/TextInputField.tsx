import React, { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import { useTheme } from "../../state/ThemeProvider";
import { useResponsive } from "../../utils/responsive";

/**
 * TextInputField - A reusable styled TextInput component
 * 
 * Provides consistent styling for text inputs with:
 * - Theme support (dark/light mode)
 * - Responsive sizing
 * - Error state styling (red border)
 * - Multiline support with proper line height
 * 
 * @example
 * ```tsx
 * <TextInputField
 *   value={name}
 *   onChangeText={setName}
 *   placeholder="Enter name"
 *   error={!!errors.name}
 * />
 * 
 * // For multiline inputs
 * <TextInputField
 *   value={note}
 *   onChangeText={setNote}
 *   multiline
 *   maxLength={300}
 *   error={!!errors.note}
 * />
 * ```
 */
interface TextInputFieldProps extends TextInputProps {
  /** Whether the input is in an error state (shows red border) */
  error?: boolean;
  /** Whether the input supports multiple lines */
  multiline?: boolean;
}

export const TextInputField = forwardRef<TextInput, TextInputFieldProps>(
  ({ error = false, multiline = false, style, ...props }, ref) => {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === "dark";
    const { scaleSpacing, scaleFont, scaleSize, isTablet } = useResponsive();

    return (
      <TextInput
        ref={ref}
        style={[
          {
            // Base input styling
            borderRadius: scaleSpacing(12),
            paddingHorizontal: scaleSpacing(16),
            paddingVertical: scaleSpacing(14),
            backgroundColor: isDark ? "#374151" : "#FFFFFF",
            // Error state shows red border, otherwise use theme border color
            borderColor: error
              ? "#EF4444"
              : isDark
                ? "#4B5563"
                : "#E5E7EB",
            borderWidth: 1.5,
            color: isDark ? "#FFFFFF" : "#111827",
            fontSize: scaleFont(isTablet ? 18 : 16),
            // Multiline-specific styling (larger height, top alignment, line height)
            ...(multiline && {
              minHeight: scaleSize(isTablet ? 120 : 100),
              textAlignVertical: "top" as const,
              lineHeight: scaleFont(isTablet ? 24 : 22),
            }),
            // Single-line inputs get medium font weight
            ...(!multiline && {
              fontWeight: "500",
            }),
          },
          style,
        ]}
        placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
        multiline={multiline}
        {...props}
      />
    );
  }
);

TextInputField.displayName = "TextInputField";

