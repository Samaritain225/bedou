import React from "react";
import { Text, TextProps } from "react-native";
import { useResponsive } from "../../utils/responsive";

/**
 * ErrorText - A reusable component for displaying form validation errors
 * 
 * Provides consistent styling for error messages with responsive sizing
 * and proper line height for readability.
 * 
 * @example
 * ```tsx
 * <ErrorText>This field is required</ErrorText>
 * ```
 */
interface ErrorTextProps extends Omit<TextProps, "style"> {
  /** The error message to display */
  children: React.ReactNode;
  /** Additional styles to apply to the error text */
  style?: TextProps["style"];
}

export function ErrorText({ children, style, ...rest }: ErrorTextProps) {
  const { scaleFont, scaleSpacing, isTablet } = useResponsive();

  return (
    <Text
      style={[
        {
          color: "#EF4444",
          fontSize: scaleFont(isTablet ? 14 : 13),
          marginTop: scaleSpacing(isTablet ? 8 : 6),
          fontWeight: "500",
          lineHeight: scaleFont(isTablet ? 20 : 18),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

