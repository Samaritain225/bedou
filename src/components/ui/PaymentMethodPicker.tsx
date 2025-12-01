import { useTheme } from "@/src/state/ThemeProvider";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type PaymentMethod = "cash" | "card" | "mobile" | "bank_transfer" | "other";

interface PaymentMethodPickerProps {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod | null) => void;
}

const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  cash: { label: "Cash", icon: "cash-outline", color: "#10B981" },
  card: { label: "Card", icon: "card-outline", color: "#3B82F6" },
  mobile: { label: "Mobile", icon: "phone-portrait-outline", color: "#8B5CF6" },
  bank_transfer: { label: "Bank Transfer", icon: "swap-horizontal-outline", color: "#F59E0B" },
  other: { label: "Other", icon: "ellipsis-horizontal-outline", color: "#6B7280" },
};

export function PaymentMethodPicker({
  value,
  onChange,
}: PaymentMethodPickerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);

  const methods: PaymentMethod[] = ["cash", "card", "mobile", "bank_transfer", "other"];
  const selectedConfig = value ? PAYMENT_METHOD_CONFIG[value] : null;

  const handleSelect = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value === method ? null : method);
    setShowModal(false);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(true);
        }}
      >
        {({ pressed }) => (
          <View
            style={{
              borderRadius: scaleSpacing(12),
              paddingHorizontal: scaleSpacing(16),
              paddingVertical: scaleSpacing(14),
              backgroundColor: isDark ? "#374151" : "#FFFFFF",
              borderColor: selectedConfig
                ? selectedConfig.color
                : isDark
                  ? "#4B5563"
                  : "#E5E7EB",
              borderWidth: selectedConfig ? 2 : 1.5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: pressed ? 0.8 : 1,
            }}
          >
            {selectedConfig ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSpacing(12), flex: 1 }}>
                <View
                  style={{
                    borderRadius: scaleSpacing(8),
                    padding: scaleSpacing(8),
                    backgroundColor: selectedConfig.color + "20",
                  }}
                >
                  <Ionicons
                    name={selectedConfig.icon}
                    size={scaleSize(20)}
                    color={selectedConfig.color}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(16),
                    fontWeight: "600",
                  }}
                  numberOfLines={1}
                >
                  {t(`transactions.paymentMethod.${value}`, selectedConfig.label)}
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  flex: 1,
                  color: isDark ? "#9CA3AF" : "#9CA3AF",
                  fontSize: scaleFont(16),
                }}
              >
                {t("transactions.selectPaymentMethod", "Select payment method")}
              </Text>
            )}
            <Ionicons
              name="chevron-down"
              size={scaleSize(20)}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
          </View>
        )}
      </Pressable>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                borderTopLeftRadius: scaleSpacing(20),
                borderTopRightRadius: scaleSpacing(20),
                paddingBottom: insets.bottom || scaleSpacing(20),
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: scaleSpacing(20),
                  paddingTop: scaleSpacing(16),
                  paddingBottom: scaleSpacing(12),
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#374151" : "#E5E7EB",
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(20),
                    fontWeight: "700",
                  }}
                >
                  {t("transactions.selectPaymentMethod", "Select Payment Method")}
                </Text>
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={{ padding: scaleSpacing(8) }}
                >
                  <Ionicons
                    name="close"
                    size={scaleSize(24)}
                    color={isDark ? "#FFFFFF" : "#111827"}
                  />
                </Pressable>
              </View>

              {/* Payment Methods List */}
              <View>
                {methods.map((method) => {
                  const config = PAYMENT_METHOD_CONFIG[method];
                  const isSelected = value === method;

                  return (
                    <Pressable
                      key={method}
                      onPress={() => handleSelect(method)}
                      style={{
                        paddingHorizontal: scaleSpacing(20),
                        paddingVertical: scaleSpacing(16),
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isSelected
                          ? isDark
                            ? "#374151"
                            : "#F3F4F6"
                          : "transparent",
                      }}
                    >
                      <View
                        style={{
                          width: scaleSize(40),
                          height: scaleSize(40),
                          borderRadius: scaleSize(20),
                          backgroundColor: config.color + "20",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: scaleSpacing(12),
                        }}
                      >
                        <Ionicons
                          name={config.icon}
                          size={scaleSize(20)}
                          color={config.color}
                        />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: scaleFont(16),
                          fontWeight: isSelected ? "600" : "500",
                        }}
                      >
                        {t(`transactions.paymentMethod.${method}`, config.label)}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={scaleSize(24)}
                          color={config.color}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Clear Selection Option */}
              {value && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChange(null);
                    setShowModal(false);
                  }}
                  style={{
                    marginHorizontal: scaleSpacing(20),
                    marginTop: scaleSpacing(8),
                    paddingVertical: scaleSpacing(12),
                    alignItems: "center",
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "#374151" : "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      color: "#EF4444",
                      fontSize: scaleFont(16),
                      fontWeight: "600",
                    }}
                  >
                    {t("transactions.clearSelection", "Clear Selection")}
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

