import { MonthlyBudgetCard } from "@/src/components/budgets/MonthlyBudgetCard";
import { MonthlyBudgetForm } from "@/src/components/budgets/MonthlyBudgetForm";
import { QuickActions } from "@/src/components/dashboard/QuickActions";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { createRecurringBillsService } from "@/src/services/firestore/recurring-bills.service";
import { createTransactionsService } from "@/src/services/firestore/transactions.service";
import { useAuth } from "@/src/state/AuthProvider";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useOnboarding } from "@/src/state/OnboardingProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useWallet } from "@/src/state/WalletProvider";
import { RecurringBillDocument, TransactionDocument } from "@/src/types/firestore";
import { formatAmountFromBase } from "@/src/utils/format";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const { user, userDocument } = useAuth();
  const { categories, currentMonth, monthlyBudget } = useCategories();
  const { baseCurrency } = useCurrency();
  const { wallet } = useWallet();
  const { colorScheme } = useTheme();
  const colors = useThemeColors();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();
  const { hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboarding();

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!onboardingLoading && !hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [hasCompletedOnboarding, onboardingLoading]);

  const [transactions, setTransactions] = useState<TransactionDocument[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionDocument[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recurringBills, setRecurringBills] = useState<RecurringBillDocument[]>([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Get current month range
  const getMonthRange = useCallback((monthYYYYMM: string) => {
    const year = Number.parseInt(monthYYYYMM.substring(0, 4));
    const month = Number.parseInt(monthYYYYMM.substring(4, 6)) - 1;
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    return { startDate, endDate };
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const transactionsService = createTransactionsService(user.uid);
      const recurringBillsService = createRecurringBillsService(user.uid);

      // Load month transactions
      const { startDate, endDate } = getMonthRange(currentMonth);
      const txns = await transactionsService.getByDateRange(startDate, endDate);
      setTransactions(txns);

      const allTxns = await transactionsService.getAll();
      setAllTransactions(allTxns);

      // Load active recurring bills
      const bills = await recurringBillsService.getActiveRecurringBills();
      setRecurringBills(bills);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setTransactions([]);
      setAllTransactions([]);
      setRecurringBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, currentMonth, getMonthRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
  }, [loadDashboardData]);

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const balance = income - expenses;

    return { expenses, income, balance };
  }, [transactions]);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const getCategory = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((cat) => cat.id === categoryId) || null;
  };

  const formatMonthLabel = (monthYYYYMM: string): string => {
    const year = Number.parseInt(monthYYYYMM.substring(0, 4));
    const month = Number.parseInt(monthYYYYMM.substring(4, 6)) - 1;
    const date = new Date(year, month, 1);
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  // Filter urgent bills: due within next 3 days
  const urgentBills = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    return recurringBills.filter(bill => {
        const dueDate = new Date(bill.nextDueDate);
        dueDate.setHours(0,0,0,0);
        return dueDate <= threeDaysFromNow;
    }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [recurringBills]);


  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Header */}
        <View style={{
            paddingHorizontal: scaleSpacing(20),
            paddingTop: scaleSpacing(16),
            paddingBottom: scaleSpacing(12),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <View>
                <Text style={{ 
                    color: colors.textSecondary, 
                    fontSize: scaleFont(14), 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                }}>
                    {t("dashboard.overview", "Overview")}
                </Text>

                <Text style={{ 
                    color: colors.textPrimary, 
                    fontSize: scaleFont(24), 
                    fontWeight: '800',
                    textTransform: 'capitalize'
                }}>
                    {formatMonthLabel(currentMonth)}
                </Text>
            </View>

        </View>

        {/* 1. HERO: Wallet Balance */}
        {wallet && (
          <View style={{ paddingHorizontal: scaleSpacing(20), marginBottom: scaleSpacing(24) }}>
            <LinearGradient
              colors={colors.gradients.wallet}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: scaleSpacing(24),
                padding: scaleSpacing(24),
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                  <Text style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: scaleFont(14),
                      fontWeight: "600",
                      marginBottom: scaleSpacing(8),
                      letterSpacing: 0.5
                    }}
                  >
                    {t("dashboard.totalBalance", "Total Balance")}
                  </Text>
                  <Text style={{
                      color: "#FFFFFF",
                      fontSize: scaleFont(36),
                      fontWeight: "800",
                      letterSpacing: -1
                    }}
                  >
                    {formatAmountFromBase(wallet.amountBase)} 
                    <Text style={{ fontSize: scaleFont(20), fontWeight: "600" }}> {baseCurrency?.symbol || "XOF"}</Text>
                  </Text>
                </View>
                <View style={{ 
                    backgroundColor: "rgba(255,255,255,0.2)", 
                    padding: scaleSpacing(8), 
                    borderRadius: scaleSpacing(12) 
                }}>
                    <Ionicons name="wallet" size={scaleSize(24)} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* 2. OVERVIEW: Income vs Expenses */}
        <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: scaleSpacing(20), 
            gap: scaleSpacing(12),
            marginBottom: scaleSpacing(24)
        }}>
            {/* Income */}
            <View style={{ 
                flex: 1, 
                backgroundColor: colors.surface, 
                padding: scaleSpacing(16), 
                borderRadius: scaleSpacing(20),
                borderWidth: 1,
                borderColor: colors.border
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
                    <Text style={{ color: colors.textSecondary, fontSize: scaleFont(12), fontWeight: '600' }}>
                        {t("dashboard.income", "Income")}
                    </Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: scaleFont(18), fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>
                    {formatAmountFromBase(monthlyTotals.income)}
                    <Text style={{ fontSize: scaleFont(12), color: colors.textSecondary }}> {baseCurrency?.symbol}</Text>
                </Text>
            </View>

            {/* Expenses */}
            <View style={{ 
                flex: 1, 
                backgroundColor: colors.surface, 
                padding: scaleSpacing(16), 
                borderRadius: scaleSpacing(20),
                borderWidth: 1,
                borderColor: colors.border
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error }} />
                    <Text style={{ color: colors.textSecondary, fontSize: scaleFont(12), fontWeight: '600' }}>
                        {t("dashboard.expenses", "Expenses")}
                    </Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: scaleFont(18), fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>
                    {formatAmountFromBase(monthlyTotals.expenses)}
                    <Text style={{ fontSize: scaleFont(12), color: colors.textSecondary }}> {baseCurrency?.symbol}</Text>
                </Text>
            </View>
        </View>

        {/* 3. BUDGET PROGRESS */}
        <MonthlyBudgetCard
            budget={monthlyBudget}
            onEdit={() => setShowBudgetForm(true)}
        />

        {/* 4. ALERTS: Urgent Bills (Only if exists) */}
        {urgentBills.length > 0 && (
            <View style={{ marginBottom: scaleSpacing(24), paddingHorizontal: scaleSpacing(20) }}>
                 <Text style={{ 
                    color: colors.textPrimary, 
                    fontSize: scaleFont(16), 
                    fontWeight: "700", 
                    marginBottom: scaleSpacing(12) 
                }}>
                    {t("dashboard.upcoming", "Up Next")}
                </Text>
                {urgentBills.map(bill => {
                    const category = categories.find(c => c.id === bill.categoryId);
                    const dueDate = new Date(bill.nextDueDate);
                    const today = new Date();
                    today.setHours(0,0,0,0); 
                    const isToday = dueDate.getTime() === today.getTime();
                    
                    return (
                        <Pressable 
                            key={bill.id}
                            onPress={() => router.push("/recurring-bills")}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                                padding: scaleSpacing(16),
                                borderRadius: scaleSpacing(16),
                                marginBottom: scaleSpacing(8),
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                            }}
                        >
                             <View style={{ 
                                 width: scaleSize(40), 
                                 height: scaleSize(40), 
                                 borderRadius: scaleSize(12), 
                                 backgroundColor: category?.color || colors.primary,
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 marginRight: scaleSpacing(12)
                             }}>
                                 <Ionicons name={category?.icon as any || "receipt"} size={20} color="#FFF" />
                             </View>
                             <View style={{ flex: 1 }}>
                                 <Text style={{ fontSize: scaleFont(15), fontWeight: '700', color: colors.textPrimary }}>
                                     {bill.name}
                                 </Text>
                                 <Text style={{ fontSize: scaleFont(12), color: colors.error, fontWeight: '600' }}>
                                     {isToday 
                                        ? t("recurring.dueToday", "Due today") 
                                        : t("recurring.dueOn", "Due {{date}}", { date: dueDate.toLocaleDateString() })
                                     }
                                 </Text>
                             </View>
                             <Text style={{ fontSize: scaleFont(16), fontWeight: '700', color: colors.textPrimary }}>
                                 {formatAmountFromBase(bill.amountBase)}
                             </Text>
                        </Pressable>
                    );
                })}
            </View>
        )}
        
        {/* Quick Actions Bar */}
        <QuickActions onRefresh={loadDashboardData} />

        {/* 5. LIST: Recent Transactions */}
        <View style={{ marginTop: scaleSpacing(24), marginBottom: scaleSpacing(20) }}>
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                paddingHorizontal: scaleSpacing(20),
                marginBottom: scaleSpacing(12)
            }}>
                <Text style={{ color: colors.textPrimary, fontSize: scaleFont(18), fontWeight: "700" }}>
                    {t("dashboard.recent", "Recent Transactions")}
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                    <Text style={{ color: colors.primary, fontSize: scaleFont(14), fontWeight: "600" }}>
                        {t("common.viewAll", "View All")}
                    </Text>
                </Pressable>
            </View>

            {transactions.length > 0 ? (
                recentTransactions.map((item) => {
                    const category = getCategory(item.categoryId || "");
                    const isExpense = item.type === "expense";
                    return (
                        <Pressable
                            key={item.id}
                            style={({ pressed }) => ({
                                marginHorizontal: scaleSpacing(20),
                                marginBottom: scaleSpacing(12),
                                padding: scaleSpacing(16),
                                borderRadius: scaleSpacing(20),
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                opacity: pressed ? 0.7 : 1
                            })}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSpacing(12) }}>
                                <View style={{
                                    width: scaleSize(44),
                                    height: scaleSize(44),
                                    borderRadius: scaleSize(16),
                                    backgroundColor: category ? category.color + "15" : colors.borderLight,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <Ionicons
                                        name={category ? (category.icon as any) : "help"}
                                        size={scaleSize(20)}
                                        color={category ? category.color : colors.textSecondary}
                                    />
                                </View>
                                <View>
                                    <Text style={{
                                        color: colors.textPrimary,
                                        fontSize: scaleFont(16),
                                        fontWeight: "600",
                                        marginBottom: 2
                                    }}>
                                        {category ? category.name : t("common.uncategorized", "Uncategorized")}
                                    </Text>
                                    <Text style={{
                                        color: colors.textSecondary,
                                        fontSize: scaleFont(12),
                                        fontWeight: "500"
                                    }}>
                                        {new Date(item.dateISO).toLocaleDateString(undefined, {
                                            weekday: 'short', 
                                            day: 'numeric', 
                                            month: 'short'
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <Text style={{
                                color: isExpense ? colors.textPrimary : colors.success,
                                fontSize: scaleFont(16),
                                fontWeight: "700",
                            }}>
                                {isExpense ? "-" : "+"}
                                {formatAmountFromBase(item.amountBase)}
                            </Text>
                        </Pressable>
                    );
                })
            ) : (
                <View style={{ padding: scaleSpacing(40), alignItems: 'center', opacity: 0.5 }}>
                    <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                    <Text style={{ marginTop: 16, color: colors.textSecondary, fontWeight: '500' }}>
                        {t("transactions.empty", "No transactions yet")}
                    </Text>
                </View>
            )}
        </View>
      </ScrollView>

      {/* Budget Form Modal */}
      <SimpleBottomSheet
        visible={showBudgetForm}
        onClose={() => setShowBudgetForm(false)}
      >
        <MonthlyBudgetForm
            initialBudget={monthlyBudget}
            onSuccess={() => {
                setShowBudgetForm(false);
                loadDashboardData();
            }}
            onCancel={() => setShowBudgetForm(false)}
        />
      </SimpleBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
