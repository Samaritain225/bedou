import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SimpleBottomSheet } from "../../src/components/ui/SimpleBottomSheet";
import { useCurrency } from "../../src/state/CurrencyProvider";
import { useTheme } from "../../src/state/ThemeProvider";
import { useResponsive } from "../../src/utils/responsive";

export default function CurrencyConverterScreen() {
  const { t } = useTranslation();
  const { currencies, isLoading, refresh, lastUpdated } = useCurrency();
  const { colorScheme } = useTheme();
  const colors = useThemeColors();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();

  const [amount, setAmount] = useState("1");
  const [fromCurrencyId, setFromCurrencyId] = useState("default-xof");
  const [toCurrencyId, setToCurrencyId] = useState("usd");
  const [result, setResult] = useState<string>("");
  
  // Selection State
  const [isSelectionVisible, setIsSelectionVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'from' | 'to'>('from');

  useEffect(() => {
    // Set initial defaults if loaded
    if (currencies.length > 1 && toCurrencyId === 'usd') {
         // ensure usd exists, else pick second
         const usd = currencies.find(c => c.code === 'USD');
         if (!usd) setToCurrencyId(currencies[1]?.id);
    }
  }, [currencies]);

  useEffect(() => {
    convert();
  }, [amount, fromCurrencyId, toCurrencyId, currencies]);

  const convert = () => {
    const from = currencies.find((c) => c.id === fromCurrencyId);
    const to = currencies.find((c) => c.id === toCurrencyId);

    if (!from || !to || !amount) {
      setResult("");
      return;
    }

    const val = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (isNaN(val)) {
        setResult("");
        return;
    }
    
    // Logic: Convert from -> Base (XOF) -> To
    // Value in Base = val * from.rateToBase
    // Value in To = Value in Base / to.rateToBase
    
    const valueInBase = val * from.rateToBase;
    const valueInTo = valueInBase / to.rateToBase;
    
    setResult(valueInTo.toFixed(2));
  };

  const swapCurrencies = () => {
    setFromCurrencyId(toCurrencyId);
    setToCurrencyId(fromCurrencyId);
  };

  const getCurrencyCode = (id: string) => currencies.find((c) => c.id === id)?.code || "";
  const getCurrencyLabel = (id: string) => currencies.find((c) => c.id === id)?.label || "";

  const openSelection = (mode: 'from' | 'to') => {
      setSelectionMode(mode);
      setIsSelectionVisible(true);
  };

  const handleSelectCurrency = (id: string) => {
      if (selectionMode === 'from') {
          setFromCurrencyId(id);
      } else {
          setToCurrencyId(id);
      }
      setIsSelectionVisible(false);
  };
  
  // XE Style Row
  const CurrencyRow = ({ 
      mode, 
      id, 
      onPress 
  }: { 
      mode: 'from' | 'to', 
      id: string, 
      onPress: () => void 
  }) => {
      const currency = currencies.find(c => c.id === id);
      const isFrom = mode === 'from';
      
      return (
        <Pressable 
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: scaleSpacing(16),
                borderBottomWidth: isFrom ? 1 : 0,
                borderBottomColor: isDark ? "#374151" : "#E5E7EB",
            }}
        >
             {/* Flag/Icon Placeholder */}
             <View style={{
                 width: scaleSize(48),
                 height: scaleSize(48),
                 borderRadius: scaleSize(24),
                 backgroundColor: isDark ? "#374151" : "#F3F4F6",
                 alignItems: 'center',
                 justifyContent: 'center',
                 marginRight: scaleSpacing(16)
             }}>
                 <Text style={{ fontSize: scaleFont(18), fontWeight: '700' }}>
                     {currency?.symbol?.substring(0, 1)}
                 </Text>
             </View>
             
             <View style={{ flex: 1 }}>
                 <Text style={{
                     color: isDark ? "#9CA3AF" : "#6B7280",
                     fontSize: scaleFont(12),
                     fontWeight: "600",
                     marginBottom: 2
                 }}>
                     {isFrom ? t("currency.from", "From") : t("currency.to", "To")}
                 </Text>
                 <Text style={{
                     color: isDark ? "#FFFFFF" : "#111827",
                     fontSize: scaleFont(20),
                     fontWeight: "700",
                 }}>
                     {currency?.code} - {currency?.label}
                 </Text>
             </View>

             <Ionicons name="chevron-down" size={scaleSize(20)} color={isDark ? "#6B7280" : "#D1D5DB"} />
        </Pressable>
      );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Header */}
        <View style={{
            paddingHorizontal: scaleSpacing(20),
            paddingTop: scaleSpacing(16),
            paddingBottom: scaleSpacing(8),
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
        }}>
            {lastUpdated && (
                <Text style={{
                    color: colors.textSecondary,
                    fontSize: scaleFont(12),
                    marginTop: scaleSpacing(4)
                }}>
                    Last updated: {format(new Date(lastUpdated * 1000), 'MMM dd, HH:mm')}
                </Text>
            )}
        </View>

        <ScrollView 
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />
            }
        >
            {/* Main Converter Area (XE Style) */}
            <View style={{
                backgroundColor: colors.surface,
                paddingHorizontal: scaleSpacing(20),
                paddingVertical: scaleSpacing(24),
            }}>
                
                {/* Amount Input */}
                <View style={{ marginBottom: scaleSpacing(24) }}>
                     <Text style={{
                         color: isDark ? "#9CA3AF" : "#6B7280",
                         fontSize: scaleFont(14),
                         fontWeight: "600",
                         marginBottom: scaleSpacing(8),
                     }}>
                         {t("currency.amount", "Amount")}
                     </Text>
                     <TextInput
                        style={{
                            fontSize: scaleFont(40),
                            fontWeight: "700",
                            color: isDark ? "#FFFFFF" : "#2563EB",
                            padding: 0,
                        }}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="1.00"
                        placeholderTextColor={isDark ? "#4B5563" : "#D1D5DB"}
                     />
                </View>

                {/* From / To Selector */}
                <View style={{ position: 'relative' }}>
                    <CurrencyRow mode="from" id={fromCurrencyId} onPress={() => openSelection('from')} />
                    
                    {/* Swap Button (Floating) */}
                    <View style={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: '50%', 
                        marginTop: -scaleSize(20),
                        zIndex: 10 
                    }}>
                        <Pressable
                            onPress={swapCurrencies}
                            style={{
                                width: scaleSize(40),
                                height: scaleSize(40),
                                borderRadius: scaleSize(20),
                                backgroundColor: isDark ? "#3B82F6" : "#2563EB",
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4
                            }}
                        >
                             <Ionicons name="swap-vertical" size={scaleSize(20)} color="#FFFFFF" />
                        </Pressable>
                    </View>
                    
                    <CurrencyRow mode="to" id={toCurrencyId} onPress={() => openSelection('to')} />
                </View>

                {/* Big Result */}
                 <View style={{ marginTop: scaleSpacing(32) }}>
                     <Text style={{
                         color: isDark ? "#9CA3AF" : "#6B7280",
                         fontSize: scaleFont(16),
                         marginBottom: scaleSpacing(4)
                     }}>
                         {amount} {getCurrencyCode(fromCurrencyId)} =
                     </Text>
                     <Text style={{
                         color: isDark ? "#FFFFFF" : "#111827",
                         fontSize: scaleFont(48),
                         fontWeight: "800",
                         lineHeight: scaleFont(56)
                     }}>
                         {result} <Text style={{ fontSize: scaleFont(24), color: isDark ? "#9CA3AF" : "#6B7280" }}>{getCurrencyCode(toCurrencyId)}</Text>
                     </Text>
                     <Text style={{
                        color: isDark ? "#9CA3AF" : "#6B7280", 
                        marginTop: scaleSpacing(8),
                        fontSize: scaleFont(14)
                     }}>
                         1 {getCurrencyCode(fromCurrencyId)} = {(currencies.find(c => c.id === fromCurrencyId)!.rateToBase / currencies.find(c => c.id === toCurrencyId)!.rateToBase).toFixed(4)} {getCurrencyCode(toCurrencyId)}
                     </Text>
                 </View>

            </View>

            {/* Live Rates Table */}
            <View style={{
                marginTop: scaleSpacing(8),
                backgroundColor: colors.surface,
                padding: scaleSpacing(20),
            }}>
                 <Text style={{
                     color: isDark ? "#FFFFFF" : "#111827",
                     fontSize: scaleFont(18),
                     fontWeight: "700",
                     marginBottom: scaleSpacing(16)
                 }}>
                     Live Rates
                 </Text>
                 
                 {currencies
                    .filter(c => c.id !== fromCurrencyId)
                    .map((currency) => {
                        // Rate relative to FROM currency
                        const fromRate = currencies.find(c => c.id === fromCurrencyId)?.rateToBase || 1;
                        const thisRate = currency.rateToBase;
                        
                        // Calculate value based on user input amount
                        const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
                        const conversionRate = fromRate / thisRate;
                        const displayValue = (numericAmount * conversionRate).toFixed(2);

                        const getCountryCode = (currencyCode: string) => {
                             switch(currencyCode) {
                                 case 'USD': return 'us';
                                 case 'EUR': return 'eu';
                                 case 'GBP': return 'gb';
                                 case 'JPY': return 'jp';
                                 case 'CNY': return 'cn';
                                 case 'NGN': return 'ng';
                                 case 'GHS': return 'gh';
                                 case 'ZAR': return 'za';
                                 case 'CAD': return 'ca';
                                 case 'XOF': return 'ci'; // West Africa (Senegal as proxy)
                                 case 'XAF': return 'cm'; // Central Africa (Cameroon as proxy)
                                 default: return null;
                             }
                        };
                        const flagCode = getCountryCode(currency.code);
                        
                        return (
                            <Pressable 
                                key={currency.id} 
                                onPress={() => {
                                    setFromCurrencyId(currency.id);
                                }}
                                style={({ pressed }) => ({
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingVertical: scaleSpacing(12),
                                    borderBottomWidth: 1,
                                    borderBottomColor: isDark ? "#374151" : "#F3F4F6",
                                    opacity: pressed ? 0.7 : 1,
                                    backgroundColor: pressed ? (isDark ? "#374151" : "#F3F4F6") : "transparent"
                                })}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                     {/* Flag or Icon */}
                                     <View style={{
                                         width: scaleSize(32),
                                         height: scaleSize(32),
                                         borderRadius: scaleSize(16),
                                         backgroundColor: isDark ? "#374151" : "#F3F4F6",
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         marginRight: scaleSpacing(12),
                                         overflow: 'hidden'
                                     }}>
                                         {flagCode ? (
                                             <Image 
                                                source={{ uri: `https://flagcdn.com/w80/${flagCode}.png` }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                             />
                                         ) : (
                                             <Text style={{ fontSize: scaleFont(14), fontWeight: '700' }}>
                                                 {currency.symbol?.substring(0, 1)}
                                             </Text>
                                         )}
                                     </View>
                                     <View style={{ flex: 1 }}>
                                         <Text style={{ color: isDark ? "#FFFFFF" : "#111827", fontWeight: '700' }}>{currency.code}</Text>
                                          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: scaleFont(12) }} numberOfLines={1}>{currency.label}</Text>
                                     </View>
                                </View>
                                <Text style={{ 
                                    color: isDark ? "#FFFFFF" : "#111827", 
                                    fontWeight: '700', 
                                    fontSize: scaleFont(16),
                                    textAlign: 'right' 
                                }}>
                                    {displayValue} <Text style={{ fontSize: scaleFont(12), color: isDark ? "#9CA3AF" : "#6B7280" }}>{currency.symbol}</Text>
                                </Text>
                            </Pressable>
                        );
                 })}
            </View>

        </ScrollView>

        <SimpleBottomSheet 
            visible={isSelectionVisible} 
            onClose={() => setIsSelectionVisible(false)}
        >
             <View style={{ padding: scaleSpacing(20) }}>
                <Text style={{
                    color: isDark ? "#FFFFFF" : "#111827",
                    fontSize: scaleFont(20),
                    fontWeight: "700",
                    marginBottom: scaleSpacing(20),
                    textAlign: "center"
                }}>
                    {t("currency.select", "Select Currency")}
                </Text>
                <FlatList
                    data={currencies}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => handleSelectCurrency(item.id)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: scaleSpacing(16),
                                borderBottomWidth: 1,
                                borderBottomColor: isDark ? "#374151" : "#E5E7EB",
                            }}
                        >
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{
                                    width: scaleSize(40),
                                    height: scaleSize(40),
                                    borderRadius: scaleSize(20),
                                    backgroundColor: isDark ? "#374151" : "#F3F4F6",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: scaleSpacing(16),
                                }}>
                                    <Text style={{ fontSize: scaleFont(16), fontWeight: '700' }}>{item.symbol}</Text>
                                </View>
                                <View>
                                    <Text style={{
                                        color: isDark ? "#FFFFFF" : "#111827",
                                        fontSize: scaleFont(16),
                                        fontWeight: "600",
                                    }}>
                                        {item.code}
                                    </Text>
                                    <Text style={{
                                        color: isDark ? "#9CA3AF" : "#6B7280",
                                        fontSize: scaleFont(14),
                                    }}>
                                        {item.label}
                                    </Text>
                                </View>
                            </View>
                             {(selectionMode === 'from' ? fromCurrencyId : toCurrencyId) === item.id && (
                                <Ionicons name="checkmark-circle" size={scaleSize(24)} color={isDark ? "#3B82F6" : "#2563EB"} />
                            )}
                        </Pressable>
                    )}
                />
            </View>
        </SimpleBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});