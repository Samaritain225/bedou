import { PRIORITY_COLORS, Priority } from "@/src/constants/priorityColors";
import { useTheme } from "@/src/state/ThemeProvider";
import { useResponsive } from "@/src/utils/responsive";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleFont } = useResponsive();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: scaleSpacing(12),
      }}
    >
      {(["high", "medium", "low"] as Priority[]).map((priority) => (
        <Pressable
          key={priority}
          onPress={() => onChange(priority)}
          style={{
            flex: 1,
            borderRadius: scaleSpacing(12),
            paddingVertical: scaleSpacing(12),
            paddingHorizontal: scaleSpacing(16),
            backgroundColor:
              value === priority
                ? PRIORITY_COLORS[priority]
                : isDark
                  ? "#374151"
                  : "#F3F4F6",
            borderWidth: 1.5,
            borderColor:
              value === priority
                ? PRIORITY_COLORS[priority]
                : isDark
                  ? "#4B5563"
                  : "#E5E7EB",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color:
                value === priority
                  ? "#FFFFFF"
                  : isDark
                    ? "#FFFFFF"
                    : "#111827",
              fontSize: scaleFont(14),
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {t(`wishlist.priority.${priority}`, priority)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

