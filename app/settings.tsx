import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrency } from "../src/state/CurrencyProvider";
import { useTheme } from "../src/state/ThemeProvider";
import { useResponsive } from "../src/utils/responsive";

const LANGUAGE_STORAGE_KEY = "@bedou_language";

/**
 * Settings Screen
 * 
 * Where users come to change their theme, language, and currency.
 * Also where developers come to realize they've been staring at
 * light mode for 8 hours straight. 👀
 */
export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useTheme();
  const { currencies, baseCurrency, makeBase } = useCurrency();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const handleSetTheme = useCallback(
    async (scheme: "light" | "dark") => {
      await setColorScheme(scheme);
    },
    [setColorScheme]
  );

  const handleSetLanguage = useCallback(
    async (lang: string) => {
      try {
        await i18n.changeLanguage(lang);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        setCurrentLanguage(lang);
      } catch (error) {
        console.error("Error changing language:", error);
      }
    },
    [i18n]
  );

  const handleSetCurrency = useCallback(
    async (currencyId: string) => {
      await makeBase(currencyId);
    },
    [makeBase]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(20),
            paddingTop: Math.max(scaleSpacing(20), insets.top),
            paddingBottom: scaleSpacing(16),
            flexDirection: "row",
            alignItems: "center",
            gap: scaleSpacing(16),
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: scaleSpacing(8),
            }}
          >
            <Ionicons
              name="arrow-back"
              size={scaleSize(24)}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </Pressable>
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(24),
              fontWeight: "700",
            }}
          >
            {t("settings.title", "Settings")}
          </Text>
        </View>

        {/* Theme Section */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(20),
            marginBottom: scaleSpacing(24),
          }}
        >
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(18),
              fontWeight: "700",
              marginBottom: scaleSpacing(16),
            }}
          >
            {t("settings.theme", "Theme")}
          </Text>
          <View
            style={{
              borderRadius: scaleSpacing(12),
              backgroundColor: isDark ? "#374151" : "#FFFFFF",
              borderWidth: 1.5,
              borderColor: isDark ? "#4B5563" : "#E5E7EB",
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={() => handleSetTheme("light")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: scaleSpacing(16),
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#4B5563" : "#E5E7EB",
                backgroundColor:
                  colorScheme === "light"
                    ? isDark
                      ? "#4B5563"
                      : "#F3F4F6"
                    : "transparent",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSpacing(12),
                }}
              >
                <Ionicons
                  name="sunny"
                  size={scaleSize(24)}
                  color={isDark ? "#FFD700" : "#F59E0B"}
                />
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(16),
                    fontWeight: "600",
                  }}
                >
                  {t("settings.light", "Light")}
                </Text>
              </View>
              {colorScheme === "light" && (
                <Ionicons
                  name="checkmark-circle"
                  size={scaleSize(24)}
                  color={isDark ? "#3B82F6" : "#2563EB"}
                />
              )}
            </Pressable>
            <Pressable
              onPress={() => handleSetTheme("dark")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: scaleSpacing(16),
                backgroundColor:
                  colorScheme === "dark"
                    ? isDark
                      ? "#4B5563"
                      : "#F3F4F6"
                    : "transparent",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSpacing(12),
                }}
              >
                <Ionicons
                  name="moon"
                  size={scaleSize(24)}
                  color={isDark ? "#9CA3AF" : "#4A5568"}
                />
                <Text
                  style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(16),
                    fontWeight: "600",
                  }}
                >
                  {t("settings.dark", "Dark")}
                </Text>
              </View>
              {colorScheme === "dark" && (
                <Ionicons
                  name="checkmark-circle"
                  size={scaleSize(24)}
                  color={isDark ? "#3B82F6" : "#2563EB"}
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* Language Section */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(20),
            marginBottom: scaleSpacing(24),
          }}
        >
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(18),
              fontWeight: "700",
              marginBottom: scaleSpacing(16),
            }}
          >
            {t("settings.language", "Language")}
          </Text>
          <View
            style={{
              borderRadius: scaleSpacing(12),
              backgroundColor: isDark ? "#374151" : "#FFFFFF",
              borderWidth: 1.5,
              borderColor: isDark ? "#4B5563" : "#E5E7EB",
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={() => handleSetLanguage("en")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: scaleSpacing(16),
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#4B5563" : "#E5E7EB",
                backgroundColor:
                  currentLanguage === "en"
                    ? isDark
                      ? "#4B5563"
                      : "#F3F4F6"
                    : "transparent",
              }}
            >
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                  fontWeight: "600",
                }}
              >
                {t("settings.english", "English")}
              </Text>
              {currentLanguage === "en" && (
                <Ionicons
                  name="checkmark-circle"
                  size={scaleSize(24)}
                  color={isDark ? "#3B82F6" : "#2563EB"}
                />
              )}
            </Pressable>
            <Pressable
              onPress={() => handleSetLanguage("fr")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: scaleSpacing(16),
                backgroundColor:
                  currentLanguage === "fr"
                    ? isDark
                      ? "#4B5563"
                      : "#F3F4F6"
                    : "transparent",
              }}
            >
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                  fontWeight: "600",
                }}
              >
                {t("settings.french", "Français")}
              </Text>
              {currentLanguage === "fr" && (
                <Ionicons
                  name="checkmark-circle"
                  size={scaleSize(24)}
                  color={isDark ? "#3B82F6" : "#2563EB"}
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* Currency Section */}
        {currencies.length > 0 && (
          <View
            style={{
              paddingHorizontal: scaleSpacing(20),
              marginBottom: scaleSpacing(24),
            }}
          >
            <Text
              style={{
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(18),
                fontWeight: "700",
                marginBottom: scaleSpacing(16),
              }}
            >
              {t("settings.currency", "Currency")}
            </Text>
            <View
              style={{
                borderRadius: scaleSpacing(12),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
                overflow: "hidden",
              }}
            >
              {currencies.map((currency, index) => (
                <Pressable
                  key={currency.id}
                  onPress={() => handleSetCurrency(currency.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: scaleSpacing(16),
                    borderBottomWidth: index < currencies.length - 1 ? 1 : 0,
                    borderBottomColor: isDark ? "#4B5563" : "#E5E7EB",
                    backgroundColor:
                      baseCurrency?.id === currency.id
                        ? isDark
                          ? "#4B5563"
                          : "#F3F4F6"
                        : "transparent",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scaleSpacing(12),
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? "#FFFFFF" : "#111827",
                        fontSize: scaleFont(16),
                        fontWeight: "600",
                      }}
                    >
                      {currency.code} - {currency.label}
                    </Text>
                    {currency.symbol && (
                      <Text
                        style={{
                          color: isDark ? "#9CA3AF" : "#6B7280",
                          fontSize: scaleFont(14),
                        }}
                      >
                        ({currency.symbol})
                      </Text>
                    )}
                  </View>
                  {baseCurrency?.id === currency.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={scaleSize(24)}
                      color={isDark ? "#3B82F6" : "#2563EB"}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* App Info Section */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(20),
            marginBottom: scaleSpacing(24),
          }}
        >
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(18),
              fontWeight: "700",
              marginBottom: scaleSpacing(16),
            }}
          >
            {t("settings.about", "About")}
          </Text>
          <View
            style={{
              borderRadius: scaleSpacing(12),
              padding: scaleSpacing(16),
              backgroundColor: isDark ? "#374151" : "#FFFFFF",
              borderWidth: 1.5,
              borderColor: isDark ? "#4B5563" : "#E5E7EB",
            }}
          >
            <Text
              style={{
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(14),
                marginBottom: scaleSpacing(8),
              }}
            >
              {t("settings.appName", "Bedou")}
            </Text>
            <Text
              style={{
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(12),
                marginBottom: scaleSpacing(12),
              }}
            >
              {t("settings.appVersion", "Version")} {Constants.expoConfig?.version || Constants.manifest?.version || "1.0.0"}
            </Text>
            <View
              style={{
                marginTop: scaleSpacing(12),
                paddingTop: scaleSpacing(12),
                borderTopWidth: 1,
                borderTopColor: isDark ? "#4B5563" : "#E5E7EB",
              }}
            >
              <Text
                style={{
                  color: isDark ? "#6B7280" : "#9CA3AF",
                  fontSize: scaleFont(11),
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                {t("settings.devNote", "Made with ❤️ and too much coffee")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
