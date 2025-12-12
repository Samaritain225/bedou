import { ThemeColors } from "@/src/constants/themeColors";
import { useRandomQuote } from "@/src/hooks/useRandomQuote";
import { useAuth } from "@/src/state/AuthProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useWallet } from "@/src/state/WalletProvider";
import { formatAmountFromBase } from "@/src/utils/format";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LANGUAGE_STORAGE_KEY = "@bedou_language";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useTheme();
  const { currencies, baseCurrency, makeBase } = useCurrency();
  const { wallet, setWalletBalance } = useWallet();
  const { signOut, userDocument, updateUserProfile } = useAuth();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();
  const quote = useRandomQuote();
  
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [balanceInput, setBalanceInput] = useState("");
  const [showBalanceInput, setShowBalanceInput] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSetBalance = useCallback(async () => {
    const numericBalance = Number.parseFloat(balanceInput);
    if (Number.isNaN(numericBalance) || numericBalance < 0) {
      return;
    }
    const amountBase = Math.round(numericBalance * 100);
    await setWalletBalance(amountBase, baseCurrency?.code || "XOF");
    setBalanceInput("");
    setShowBalanceInput(false);
  }, [balanceInput, setWalletBalance, baseCurrency]);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      t("settings.signOutConfirmTitle", "Sign Out"),
      t("settings.signOutConfirmMessage", "Are you sure you want to sign out?"),
      [
        { text: t("settings.cancel", "Cancel"), style: "cancel" },
        {
          text: t("settings.signOut", "Sign Out"),
          style: "destructive",
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
              router.replace('/(auth)/phone-input' as any);
            } catch (error) {
              console.error("Error signing out:", error);
              setIsSigningOut(false);
              Alert.alert("Error", "Failed to sign out.");
            }
          },
        },
      ]
    );
  }, [signOut, t]);

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={{
        marginTop: scaleSpacing(8),
        marginBottom: scaleSpacing(16),
        paddingHorizontal: scaleSpacing(20),
        paddingVertical: scaleSpacing(8),
    }}>
        <Text
            style={{
                color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                fontSize: scaleFont(14),
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                opacity: 0.9,
            }}
        >
            {title}
        </Text>
    </View>
  );

  /* Updated SettingsGroup for better separation */
  const SettingsGroup = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <View style={{ marginBottom: scaleSpacing(24) }}>
        {title && <SectionHeader title={title} />}
        <View style={{
            backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
            borderRadius: scaleSize(16),
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? ThemeColors.dark.borderLight : ThemeColors.light.borderLight,
        }}>
            {children}
        </View>
    </View>
  );

  /* Redesigned Action Card with Premium Aesthetics */
  const ActionCard = ({ icon, label, description, onPress, gradient }: { 
    icon: string, 
    label: string, 
    description: string,
    onPress: () => void, 
    gradient: readonly [string, string] 
  }) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
            width: scaleSize(200),
            marginRight: scaleSpacing(16),
            backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
            borderRadius: scaleSize(24),
            padding: scaleSpacing(24),
            borderWidth: 1.5,
            borderColor: isDark ? ThemeColors.dark.borderLight : ThemeColors.light.borderLight,
            opacity: pressed ? 0.95 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: pressed ? 8 : 4 },
            shadowOpacity: pressed ? 0.15 : 0.08,
            shadowRadius: pressed ? 16 : 12,
            elevation: pressed ? 8 : 4,
        })}
    >
        <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                width: scaleSize(64),
                height: scaleSize(64),
                borderRadius: scaleSize(20),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: scaleSpacing(20),
                shadowColor: gradient[0],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
            }}
        >
            <Ionicons name={icon as any} size={scaleSize(32)} color="#FFFFFF" />
        </LinearGradient>
        
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Text style={{
                fontSize: scaleFont(18),
                fontWeight: '700',
                color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                marginBottom: scaleSpacing(6),
                letterSpacing: -0.5,
            }}>
                {label}
            </Text>
            <Text style={{
                fontSize: scaleFont(13),
                fontWeight: '500',
                color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                lineHeight: scaleSize(18),
                opacity: 0.8,
            }}>
                {description}
            </Text>
        </View>
        
        <View style={{
            position: 'absolute',
            top: scaleSpacing(20),
            right: scaleSpacing(20),
            width: scaleSize(28),
            height: scaleSize(28),
            borderRadius: scaleSize(14),
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Ionicons name="chevron-forward" size={scaleSize(16)} color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary} />
        </View>
    </Pressable>
  );

  /* New Theme Selector Component */
  const ThemeSelector = () => (
    <View style={{
        backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
        borderRadius: scaleSize(16),
        padding: scaleSpacing(4),
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: isDark ? ThemeColors.dark.borderLight : ThemeColors.light.borderLight,
        marginBottom: scaleSpacing(16),
    }}>
        <Pressable
            onPress={() => handleSetTheme('light')}
            style={{
                flex: 1,
                paddingVertical: scaleSpacing(12),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: scaleSize(12),
                backgroundColor: !isDark ? ThemeColors.light.surfaceSecondary : 'transparent',
                flexDirection: 'row',
                gap: scaleSpacing(8),
            }}
        >
             <Ionicons name="sunny" size={scaleSize(20)} color={!isDark ? ThemeColors.light.warning : ThemeColors.dark.textSecondary} />
             <Text style={{
                 fontSize: scaleFont(14),
                 fontWeight: '600',
                 color: !isDark ? ThemeColors.light.text : ThemeColors.dark.textSecondary
             }}>{t("settings.theme.light", "Light")}</Text>
        </Pressable>
        <Pressable
            onPress={() => handleSetTheme('dark')}
            style={{
                flex: 1,
                paddingVertical: scaleSpacing(12),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: scaleSize(12),
                backgroundColor: isDark ? ThemeColors.dark.surfaceSecondary : 'transparent',
                flexDirection: 'row',
                gap: scaleSpacing(8),
            }}
        >
             <Ionicons name="moon" size={scaleSize(20)} color={isDark ? ThemeColors.dark.primary : ThemeColors.light.textSecondary} />
             <Text style={{
                 fontSize: scaleFont(14),
                 fontWeight: '600',
                 color: isDark ? ThemeColors.dark.text : ThemeColors.light.textSecondary
             }}>{t("settings.theme.dark", "Dark")}</Text>
        </Pressable>
    </View>
  );

  /* Simple Selection Card - Scalable for any number of options */
  const SelectionCard = ({ 
    icon, 
    label, 
    currentValue, 
    onPress,
    gradient 
  }: { 
    icon: string, 
    label: string, 
    currentValue: string,
    onPress: () => void,
    gradient: readonly [string, string]
  }) => (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
            backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
            borderRadius: scaleSize(20),
            padding: scaleSpacing(20),
            borderWidth: 1.5,
            borderColor: isDark ? ThemeColors.dark.borderLight : ThemeColors.light.borderLight,
            opacity: pressed ? 0.95 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            marginBottom: scaleSpacing(16),
        })}
      >
          <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              justifyContent: 'space-between',
          }}>
              {/* Left: Icon + Content */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleSpacing(16), flex: 1 }}>
                  <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                          width: scaleSize(48),
                          height: scaleSize(48),
                          borderRadius: scaleSize(14),
                          alignItems: 'center',
                          justifyContent: 'center',
                      }}
                  >
                      <Ionicons name={icon as any} size={scaleSize(24)} color="#FFFFFF" />
                  </LinearGradient>
                  
                  <View style={{ flex: 1 }}>
                      <Text style={{
                          fontSize: scaleFont(12),
                          color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                          marginBottom: scaleSpacing(4),
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                      }}>{label}</Text>
                      
                      <Text style={{
                          fontSize: scaleFont(17),
                          fontWeight: '700',
                          color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                          letterSpacing: -0.3,
                      }} numberOfLines={1}>{currentValue}</Text>
                  </View>
              </View>
              
              {/* Right: Chevron */}
              <Ionicons 
                  name="chevron-forward" 
                  size={scaleSize(20)} 
                  color={isDark ? ThemeColors.dark.textTertiary : ThemeColors.light.textTertiary} 
              />
          </View>
      </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        {
            backgroundColor: isDark ? ThemeColors.dark.background : ThemeColors.light.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header */}
        <View style={{
          paddingHorizontal: scaleSpacing(16),
          paddingVertical: scaleSpacing(12),
          flexDirection: "row",
          alignItems: "center",
          gap: scaleSpacing(12),
      }}>
        <Pressable 
            onPress={() => router.back()}
            style={{
                width: scaleSize(32),
                height: scaleSize(32),
                borderRadius: scaleSize(16),
                backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Ionicons name="arrow-back" size={scaleSize(20)} color={isDark ? ThemeColors.dark.text : ThemeColors.light.text} />
        </Pressable>
        <Text style={{
            color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
            fontSize: scaleFont(30),
            fontWeight: "bold",
            letterSpacing: -0.5
        }}>
            {t("settings.title", "Settings")}
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: scaleSpacing(16) 
        }}
      >
        
        <ProfileSection 
            userDoc={userDocument} 
            onUpdateName={(name) => updateUserProfile({ displayName: name })}
            isDark={isDark}
        />

        {/* Wallet Section - Minimalist */}
        {/* Wallet Section - Minimalist */}
        <SettingsGroup title={t("settings.wallet", "Budget")}>
             <Pressable style={{ padding: scaleSpacing(20), alignItems: 'center', justifyContent: 'center' }}>
                 {!showBalanceInput ? (
                     <View style={{ alignItems: 'center' }}>
                         <Text style={{ color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary, fontSize: scaleFont(14), marginBottom: 4 }}>
                            Current Balance
                         </Text>
                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                             <Text style={{ color: isDark ? ThemeColors.dark.text : ThemeColors.light.text, fontSize: scaleFont(32), fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                                {wallet ? formatAmountFromBase(wallet.amountBase) : "0.00"}
                             </Text>
                             <Text style={{ color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary, fontSize: scaleFont(20), fontWeight: '600' }}>
                                 {baseCurrency?.symbol}
                             </Text>
                             <Pressable 
                                onPress={() => {
                                    setShowBalanceInput(true);
                                    if (wallet) setBalanceInput(formatAmountFromBase(wallet.amountBase));
                                }}
                                style={{ 
                                    marginLeft: 8,
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: isDark ? ThemeColors.dark.surfaceSecondary : ThemeColors.light.surfaceSecondary,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                             >
                                 <Ionicons name="pencil" size={14} color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary} />
                             </Pressable>
                         </View>
                     </View>
                 ) : (
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
                        <TextInput
                            value={balanceInput}
                            onChangeText={(text) => {
                                const cleaned = text.replace(/[^0-9.]/g, "");
                                setBalanceInput(cleaned);
                            }}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary}
                            style={{
                                flex: 1,
                                height: scaleSize(44),
                                borderRadius: scaleSize(8),
                                backgroundColor: isDark ? ThemeColors.dark.surfaceSecondary : ThemeColors.light.surfaceSecondary,
                                paddingHorizontal: scaleSpacing(12),
                                color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                                fontSize: scaleFont(18),
                                fontWeight: "600"
                            }}
                            autoFocus
                        />
                         <Pressable onPress={() => setShowBalanceInput(false)} style={{ padding: 8 }}>
                             <Ionicons name="close-circle" size={24} color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary} />
                         </Pressable>
                         <Pressable 
                            onPress={handleSetBalance}
                            style={{ 
                                backgroundColor: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                                paddingHorizontal: 16,
                                height: scaleSize(44),
                                borderRadius: scaleSize(8),
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                         >
                             <Text style={{ color: isDark ? ThemeColors.dark.background : ThemeColors.light.background, fontWeight: "600" }}>Save</Text>
                         </Pressable>
                     </View>
                 )}
             </Pressable>
        </SettingsGroup>


        {/* Management Section */}
        <View style={{ marginBottom: scaleSpacing(40) }}>
            <SectionHeader title={t("settings.management", "Management")} />
            
            {/* Recurring Bills */}
            <Pressable
                onPress={() => router.push("/recurring-bills")}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: scaleSpacing(16),
                    paddingHorizontal: scaleSpacing(16),
                    opacity: pressed ? 0.6 : 1,
                    gap: scaleSpacing(16),
                })}
            >
                <LinearGradient
                    colors={isDark ? ['#818CF8', '#6366F1'] : ['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: scaleSize(52),
                        height: scaleSize(52),
                        borderRadius: scaleSize(26),
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="receipt-outline" size={scaleSize(26)} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: scaleFont(17),
                        fontWeight: '700',
                        color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                        marginBottom: scaleSpacing(2),
                    }}>{t("settings.recurringBills", "Recurring Bills")}</Text>
                    <Text style={{
                        fontSize: scaleFont(13),
                        fontWeight: '500',
                        color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    }}>Track subscriptions & payments</Text>
                </View>
            </Pressable>

            {/* Wishlist */}
            <Pressable
                onPress={() => router.push("/wishlist")}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: scaleSpacing(16),
                    paddingHorizontal: scaleSpacing(16),
                    opacity: pressed ? 0.6 : 1,
                    gap: scaleSpacing(16),
                })}
            >
                <LinearGradient
                    colors={isDark ? ['#FB7185', '#F43F5E'] : ['#F43F5E', '#E11D48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: scaleSize(52),
                        height: scaleSize(52),
                        borderRadius: scaleSize(26),
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="heart-outline" size={scaleSize(26)} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: scaleFont(17),
                        fontWeight: '700',
                        color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                        marginBottom: scaleSpacing(2),
                    }}>{t("settings.wishlist", "Wishlist")}</Text>
                    <Text style={{
                        fontSize: scaleFont(13),
                        fontWeight: '500',
                        color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    }}>Save items for later</Text>
                </View>
            </Pressable>

            {/* Categories */}
            <Pressable
                onPress={() => router.push("/categories")}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: scaleSpacing(16),
                    paddingHorizontal: scaleSpacing(16),
                    opacity: pressed ? 0.6 : 1,
                    gap: scaleSpacing(16),
                })}
            >
                <LinearGradient
                    colors={isDark ? ['#FBBF24', '#F59E0B'] : ['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: scaleSize(52),
                        height: scaleSize(52),
                        borderRadius: scaleSize(26),
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="pricetags-outline" size={scaleSize(26)} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: scaleFont(17),
                        fontWeight: '700',
                        color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                        marginBottom: scaleSpacing(2),
                    }}>{t("settings.categories", "Categories")}</Text>
                    <Text style={{
                        fontSize: scaleFont(13),
                        fontWeight: '500',
                        color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    }}>Organize expenses</Text>
                </View>
            </Pressable>
        </View>

        {/* Appearance Section */}
        <View style={{ marginBottom: scaleSpacing(40) }}>
            <SectionHeader title={t("settings.appearance", "Appearance")} />
            
            <ThemeSelector />

            {/* Language */}
            <Pressable
                onPress={() => {
                    Alert.alert(
                        t("settings.selectLanguage", "Select Language"),
                        undefined,
                        [
                            {
                                text: 'English',
                                onPress: () => handleSetLanguage('en'),
                            },
                            {
                                text: 'Français',
                                onPress: () => handleSetLanguage('fr'),
                            },
                            {
                                text: t("settings.cancel", "Cancel"),
                                style: 'cancel'
                            }
                        ]
                    );
                }}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: scaleSpacing(16),
                    paddingHorizontal: scaleSpacing(16),
                    opacity: pressed ? 0.6 : 1,
                    gap: scaleSpacing(16),
                })}
            >
                <LinearGradient
                    colors={isDark ? ['#6EE7B7', '#10B981'] : ['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: scaleSize(52),
                        height: scaleSize(52),
                        borderRadius: scaleSize(26),
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="language-outline" size={scaleSize(26)} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: scaleFont(17),
                        fontWeight: '700',
                        color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                        marginBottom: scaleSpacing(2),
                    }}>{t("settings.language", "Language")}</Text>
                    <Text style={{
                        fontSize: scaleFont(13),
                        fontWeight: '500',
                        color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    }}>{currentLanguage === 'en' ? 'English' : 'Français'}</Text>
                </View>
            </Pressable>

            {/* Currency */}
            {currencies.length > 0 && (
                <Pressable
                    onPress={() => {
                        Alert.alert(
                            t("settings.selectCurrency", "Select Currency"),
                            undefined,
                            [
                                ...currencies.map(currency => ({
                                    text: `${currency.code} (${currency.symbol})`,
                                    onPress: () => handleSetCurrency(currency.id),
                                })),
                                {
                                    text: t("settings.cancel", "Cancel"),
                                    style: 'cancel' as const
                                }
                            ]
                        );
                    }}
                    style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: scaleSpacing(16),
                        paddingHorizontal: scaleSpacing(16),
                        opacity: pressed ? 0.6 : 1,
                        gap: scaleSpacing(16),
                    })}
                >
                    <LinearGradient
                        colors={isDark ? ['#22D3EE', '#06B6D4'] : ['#06B6D4', '#0891B2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: scaleSize(52),
                            height: scaleSize(52),
                            borderRadius: scaleSize(26),
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="cash-outline" size={scaleSize(26)} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontSize: scaleFont(17),
                            fontWeight: '700',
                            color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                            marginBottom: scaleSpacing(2),
                        }}>{t("settings.currency", "Currency")}</Text>
                        <Text style={{
                            fontSize: scaleFont(13),
                            fontWeight: '500',
                            color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                        }}>{baseCurrency?.code} ({baseCurrency?.symbol})</Text>
                    </View>
                </Pressable>
            )}
        </View>


        {/* Logout Button */}
        <Pressable 
            onPress={handleSignOut}
            disabled={isSigningOut}
            style={({ pressed }) => ({
                backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : '#FEF2F2',
                borderRadius: scaleSize(16),
                padding: scaleSpacing(18),
                borderWidth: 1,
                borderColor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#FEE2E2',
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: scaleSpacing(10),
                marginBottom: scaleSpacing(48),
            })}
        >
            <Ionicons 
                name={isSigningOut ? "hourglass-outline" : "log-out-outline"} 
                size={scaleSize(22)} 
                color={ThemeColors.light.error} 
            />
            <Text style={{
                color: ThemeColors.light.error,
                fontSize: scaleFont(17),
                fontWeight: '600',
            }}>
                {isSigningOut ? t("settings.signingOut", "Signing out...") : t("settings.signOut", "Sign Out")}
            </Text>
        </Pressable>

        {/* Quote Section - Footer */}
        {quote && (
            <View style={{
                marginBottom: scaleSpacing(20),
                paddingHorizontal: scaleSpacing(16),
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.8
            }}>
                <Ionicons name="chatbox-ellipses-outline" size={scaleSize(20)} color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary} style={{ marginBottom: scaleSpacing(8), opacity: 0.5 }} />
                <Text style={{
                    color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    fontSize: scaleFont(14),
                    fontWeight: "500",
                    fontStyle: "italic",
                    textAlign: "center",
                    lineHeight: scaleSize(22),
                    marginBottom: scaleSpacing(8)
                }}>
                    "{quote.text}"
                </Text>
                <Text style={{
                    color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    fontSize: scaleFont(12),
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 1
                }}>
                    — {quote.author}
                </Text>
            </View>
        )}

        {/* App Version - After Quote */}
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: scaleSpacing(16),
            opacity: 0.6
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: scaleSpacing(8)
            }}>
                <Ionicons name="wallet-outline" size={scaleSize(16)} color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary} />
                <Text style={{
                    fontSize: scaleFont(12),
                    color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    fontWeight: '600',
                    letterSpacing: 0.5
                }}>
                    Bedou v{Constants.expoConfig?.version || '1.0.0'}
                </Text>
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

/* Additional Components */
const ProfileSection = ({ userDoc, onUpdateName, isDark }: { userDoc: any, onUpdateName: (name: string) => void, isDark: boolean }) => {
    const { scaleSize, scaleFont, scaleSpacing } = useResponsive();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(userDoc?.displayName || "");

    const handleSave = () => {
        if (name.trim() !== "") {
            onUpdateName(name);
            setIsEditing(false);
        }
    };

    return (
        <View style={{
            marginBottom: scaleSpacing(32),
            alignItems: 'center',
            marginTop: scaleSpacing(16)
        }}>
            <View style={{
                width: scaleSize(80),
                height: scaleSize(80),
                borderRadius: scaleSize(40),
                backgroundColor: isDark ? ThemeColors.dark.surfaceSecondary : ThemeColors.light.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: scaleSpacing(16)
            }}>
                {userDoc?.photoURL ? (
                    <Image source={{ uri: userDoc.photoURL }} style={{ width: '100%', height: '100%', borderRadius: scaleSize(40) }} />
                ) : (
                    <Text style={{ fontSize: scaleFont(32), fontWeight: "bold", color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary }}>
                        {(userDoc?.displayName || "U").charAt(0).toUpperCase()}
                    </Text>
                )}
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: ThemeColors.light.success,
                    width: scaleSize(24),
                    height: scaleSize(24),
                    borderRadius: scaleSize(12),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: isDark ? ThemeColors.dark.background : ThemeColors.light.background
                }}>
                    <Ionicons name="camera" size={scaleSize(12)} color="#FFFFFF" />
                </View>
            </View>

            {isEditing ? (
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary}
                        style={{
                            height: scaleSize(40),
                            borderRadius: scaleSize(8),
                            backgroundColor: isDark ? ThemeColors.dark.surfaceSecondary : ThemeColors.light.surfaceSecondary,
                            paddingHorizontal: scaleSpacing(12),
                            color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                            fontSize: scaleFont(18),
                            fontWeight: "600",
                            minWidth: 150,
                            textAlign: 'center'
                        }}
                        autoFocus
                    />
                    <Pressable onPress={() => setIsEditing(false)} style={{ padding: 4 }}>
                         <Ionicons name="close-circle" size={24} color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary} />
                     </Pressable>
                     <Pressable onPress={handleSave} style={{ padding: 4 }}>
                         <Ionicons name="checkmark-circle" size={24} color={ThemeColors.light.success} />
                     </Pressable>
                 </View>
            ) : (
                <View style={{ alignItems: 'center' }}>
                    <Pressable onPress={() => setIsEditing(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{
                            color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                            fontSize: scaleFont(24),
                            fontWeight: "700",
                        }}>
                            {userDoc?.displayName || "User"}
                        </Text>
                        <Ionicons name="pencil" size={scaleSize(16)} color={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary} />
                    </Pressable>
                    {userDoc?.phoneNumber && (
                         <Text style={{
                            color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                            fontSize: scaleFont(14),
                            marginTop: scaleSpacing(4)
                        }}>
                            {userDoc.phoneNumber}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};
