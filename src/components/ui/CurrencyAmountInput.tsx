import React, { forwardRef } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useResponsive } from "@/src/utils/responsive";

interface CurrencyAmountInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
}

export const CurrencyAmountInput = forwardRef<TextInput, CurrencyAmountInputProps>(
  ({ value, onChangeText, error = false, style, ...props }, ref) => {
    const { baseCurrency } = useCurrency();
    const { colorScheme } = useTheme();
    const isDark = colorScheme === "dark";
    const { scaleSpacing, scaleSize, scaleFont, isTablet } = useResponsive();

    return (
      <View
        style={{
          borderRadius: scaleSpacing(12),
          paddingHorizontal: scaleSpacing(16),
          paddingVertical: scaleSpacing(14),
          backgroundColor: isDark ? "#374151" : "#FFFFFF",
          borderColor: error
            ? "#EF4444"
            : isDark
              ? "#4B5563"
              : "#E5E7EB",
          borderWidth: 1.5,
          flexDirection: "row",
          alignItems: "center",
          gap: scaleSpacing(12),
        }}
      >
        <Text
          style={{
            color: isDark ? "#FFFFFF" : "#111827",
            fontSize: scaleFont(isTablet ? 18 : 16),
            fontWeight: "600",
            minWidth: scaleSize(isTablet ? 60 : 50),
          }}
        >
          {baseCurrency?.symbol || baseCurrency?.code || ""}
        </Text>
        <TextInput
          ref={ref}
          style={[
            {
              flex: 1,
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(isTablet ? 18 : 16),
              fontWeight: "500",
            },
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
          keyboardType="decimal-pad"
          {...props}
        />
      </View>
    );
  }
);

CurrencyAmountInput.displayName = "CurrencyAmountInput";

