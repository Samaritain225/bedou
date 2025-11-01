import React from "react";
import { Text, TextProps } from "react-native";
import { useTheme } from "../../state/ThemeProvider";
import { useResponsive } from "../../utils/responsive";

/**
 * FormLabel - A reusable label component for form fields
 * 
 * Provides consistent styling for form labels with responsive sizing,
 * theme support, and optional indicator text.
 * 
 * @example
 * ```tsx
 * <FormLabel>Name</FormLabel>
 * <FormLabel optional optionalText="(Optional)">Note</FormLabel>
 * ```
 */
interface FormLabelProps extends Omit<TextProps, "style"> {
  /** The label text to display */
  children: React.ReactNode;
  /** Whether to show an optional indicator after the label */
  optional?: boolean;
  /** Custom text for the optional indicator (defaults to "(Optional)") */
  optionalText?: string;
  /** Additional styles to apply to the label */
  style?: TextProps["style"];
}

export function FormLabel({
  children,
  optional = false,
  optionalText,
  style,
  ...rest
}: FormLabelProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleFont, scaleSpacing, isTablet } = useResponsive();

  return (
    <Text
      style={[
        {
          fontSize: scaleFont(isTablet ? 17 : 16),
          marginBottom: scaleSpacing(isTablet ? 10 : 8),
          color: isDark ? "#F3F4F6" : "#111827",
          fontWeight: "600",
          letterSpacing: 0.1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
      {/* Optional indicator - displayed in a lighter color and smaller font */}
      {optional && (
        <Text
          style={{
            fontSize: scaleFont(isTablet ? 15 : 14),
            fontWeight: "400",
            color: isDark ? "#9CA3AF" : "#6B7280",
          }}
        >
          {" "}
          {optionalText || "(Optional)"}
        </Text>
      )}
    </Text>
  );
}

