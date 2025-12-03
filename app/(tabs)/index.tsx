import { MonthlyBudgetCard } from "@/src/components/budgets/MonthlyBudgetCard";
import { MonthlyBudgetForm } from "@/src/components/budgets/MonthlyBudgetForm";
import { CategoryBreakdownChart } from "@/src/components/charts/CategoryBreakdownChart";
import { MonthlyTrendsChart } from "@/src/components/charts/MonthlyTrendsChart";
import { QuickActions } from "@/src/components/dashboard/QuickActions";
import { PlannedPurchaseForm } from "@/src/components/forms/PlannedPurchaseForm";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { PRIORITY_COLORS } from "@/src/constants/priorityColors";
// import { useDb } from "@/src/db/hooks"; // REMOVED
import { createPlannedPurchasesService } from "@/src/services/firestore/planned-purchases.service";
import { createRecurringBillsService } from "@/src/services/firestore/recurring-bills.service";
import { createTransactionsService } from "@/src/services/firestore/transactions.service";
import { useAuth } from "@/src/state/AuthProvider"; // Added useAuth
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useOnboarding } from "@/src/state/OnboardingProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useWallet } from "@/src/state/WalletProvider";
import { PlannedPurchaseDocument, RecurringBillDocument, TransactionDocument } from "@/src/types/firestore";
import { formatAmountFromBase } from "@/src/utils/format";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function DashboardScreen() {
  const { t } = useTranslation();
  // const db = useDb(); // REMOVED
  const { user } = useAuth(); // Get authenticated user
  const { categories, currentMonth, monthlyBudget } = useCategories();
  const { baseCurrency } = useCurrency();
  const { wallet } = useWallet();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const { hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboarding();

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!onboardingLoading && !hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [hasCompletedOnboarding, onboardingLoading]);

  const [transactions, setTransactions] = useState<TransactionDocument[]>( // Renamed from recentTransactions to transactions
    []
  );
  const [allTransactions, setAllTransactions] = useState<TransactionDocument[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plannedPurchases, setPlannedPurchases] = useState<PlannedPurchaseDocument[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBillDocument[]>([]);
  const [showWishlistForm, setShowWishlistForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Get current month range
  const getMonthRange = useCallback((monthYYYYMM: string) => {
    const year = Number.parseInt(monthYYYYMM.substring(0, 4));
    const month = Number.parseInt(monthYYYYMM.substring(4, 6)) - 1;
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    return { startDate, endDate };
  }, []);

  // Get current week range
  const getWeekRange = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek; // Start from Sunday
    const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return {
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    };
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      // Create service instances for this user
      const transactionsService = createTransactionsService(user.uid);
      const plannedPurchasesService = createPlannedPurchasesService(user.uid);
      const recurringBillsService = createRecurringBillsService(user.uid);

      // Load month transactions
      const { startDate, endDate } = getMonthRange(currentMonth);
      const txns = await transactionsService.getByDateRange(startDate, endDate);
      setTransactions(txns);

      const allTxns = await transactionsService.getAll();
      setAllTransactions(allTxns);

      // Load planned purchases (pending)
      const purchases = await plannedPurchasesService.getActivePlannedPurchases();
      setPlannedPurchases(purchases);

      // Load recurring bills (only active ones)
      const bills = await recurringBillsService.getActiveRecurringBills();
      setRecurringBills(bills);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setTransactions([]);
      setAllTransactions([]);
      setPlannedPurchases([]);
      setRecurringBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, currentMonth, getMonthRange]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
  }, [loadDashboardData]);


  // All transactions for week and month calculations
  // const [allTransactions, setAllTransactions] = useState<TransactionDocument[]>([]); // REMOVED DUPLICATE

  // Get week range
  const weekRange = useMemo(() => getWeekRange(), [getWeekRange]);

  // Calculate weekly totals
  const weeklyTotals = useMemo(() => {
    const weekTxns = allTransactions.filter((t) => {
      const txnDate = new Date(t.dateISO);
      return txnDate >= new Date(weekRange.startDate) && txnDate <= new Date(weekRange.endDate);
    });

    const expenses = weekTxns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const income = weekTxns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const balance = income - expenses;
    const count = weekTxns.length;

    return {
      expenses,
      income,
      balance,
      count,
    };
  }, [allTransactions, weekRange]);

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const expenses = allTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const income = allTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const balance = income - expenses;
    const count = allTransactions.length;
    const expenseCount = allTransactions.filter((t) => t.type === "expense").length;
    const incomeCount = allTransactions.filter((t) => t.type === "income").length;

    return {
      expenses,
      income,
      balance,
      count,
      expenseCount,
      incomeCount,
    };
  }, [transactions]);

  // Calculate average daily expense (for month)
  // If you're reading this, you've probably spent more today than this average 😅
  const averageDailyExpense = useMemo(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysPassed = Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return daysPassed > 0 ? monthlyTotals.expenses / daysPassed : 0;
  }, [monthlyTotals.expenses]);

  // Calculate average daily expense (for week)
  const averageDailyExpenseWeek = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(weekRange.startDate);
    const daysPassed = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return daysPassed > 0 ? weeklyTotals.expenses / daysPassed : 0;
  }, [weeklyTotals.expenses, weekRange]);



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
    return new Date(year, month, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const handleMarkAsPurchased = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const plannedPurchasesService = createPlannedPurchasesService(user.uid);
      await plannedPurchasesService.markAsPurchased(id);
      await loadDashboardData();
    } catch (error) {
      console.error("Error marking as purchased:", error);
    }
  }, [loadDashboardData, user]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#111827" : "#FFFFFF",
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#3B82F6" : "#2563EB"}
          style={{ marginTop: scaleSpacing(40) }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#3B82F6" : "#2563EB"}
          />
        }
      >
        {/* Month Header */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(20),
            paddingTop: scaleSpacing(20),
            paddingBottom: scaleSpacing(16),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(20),
              fontWeight: "700",
            }}
          >
            {formatMonthLabel(currentMonth)}
          </Text>
        </View>

        {/* Quick Actions */}
        <QuickActions onRefresh={loadDashboardData} />

        {/* Monthly Budget Card */}
        <MonthlyBudgetCard
          budget={monthlyBudget}
          onEdit={() => setShowBudgetForm(true)}
        />

        {/* Recurring Bills Section */}
        {recurringBills.length > 0 && (
          <View style={{ marginBottom: scaleSpacing(24) }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: scaleSpacing(20),
                marginBottom: scaleSpacing(16),
              }}
            >
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(18),
                  fontWeight: "700",
                }}
              >
                {t("dashboard.recurringBills", "Upcoming Bills")}
              </Text>
              <Pressable
                onPress={() => router.push("/recurring-bills")}
                style={{
                  paddingHorizontal: scaleSpacing(12),
                  paddingVertical: scaleSpacing(8),
                  borderRadius: scaleSpacing(8),
                  backgroundColor: isDark ? "#3B82F6" : "#2563EB",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scaleFont(12),
                    fontWeight: "600",
                  }}
                >
                  {t("common.viewAll", "View All")}
                </Text>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: scaleSpacing(20) }}>
              {recurringBills
                .filter((bill) => {
                  const dueDate = new Date(bill.nextDueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDate.setHours(0, 0, 0, 0);
                  // Show bills due in the next 30 days or overdue
                  const daysUntilDue = Math.ceil(
                    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return daysUntilDue <= 30;
                })
                .sort((a, b) => {
                  return (
                    new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
                  );
                })
                .slice(0, 3)
                .map((bill) => {
                  const category = categories.find((c) => c.id === bill.categoryId);
                  const dueDate = new Date(bill.nextDueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDate.setHours(0, 0, 0, 0);
                  const isOverdue = dueDate < today;
                  const daysUntilDue = Math.ceil(
                    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <Pressable
                      key={bill.id}
                      onPress={() => router.push("/recurring-bills")}
                      style={{
                        borderRadius: scaleSpacing(12),
                        padding: scaleSpacing(16),
                        backgroundColor: isDark ? "#374151" : "#FFFFFF",
                        borderWidth: 1.5,
                        borderColor: isOverdue
                          ? "#EF4444"
                          : isDark
                            ? "#4B5563"
                            : "#E5E7EB",
                        borderLeftWidth: 4,
                        borderLeftColor: category?.color || "#6B7280",
                        marginBottom: scaleSpacing(12),
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: scaleSpacing(10),
                              marginBottom: scaleSpacing(8),
                            }}
                          >
                            {category && (
                              <Ionicons
                                name={category.icon as any}
                                size={scaleSize(20)}
                                color={category.color}
                              />
                            )}
                            <Text
                              style={{
                                color: isDark ? "#FFFFFF" : "#111827",
                                fontSize: scaleFont(16),
                                fontWeight: "600",
                                flex: 1,
                              }}
                              numberOfLines={1}
                            >
                              {bill.name}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={{
                                color: isOverdue
                                  ? "#EF4444"
                                  : isDark
                                    ? "#9CA3AF"
                                    : "#6B7280",
                                fontSize: scaleFont(14),
                                fontWeight: "500",
                              }}
                            >
                              {isOverdue
                                ? t("recurring.overdue", "Overdue")
                                : daysUntilDue === 0
                                  ? t("recurring.dueToday", "Due today")
                                  : daysUntilDue === 1
                                    ? t("recurring.dueTomorrow", "Due tomorrow")
                                    : t(
                                        "recurring.dueInDays",
                                        `Due in ${daysUntilDue} days`,
                                        { count: daysUntilDue }
                                      )}
                            </Text>
                            <Text
                              style={{
                                color: isDark ? "#FFFFFF" : "#111827",
                                fontSize: scaleFont(16),
                                fontWeight: "600",
                              }}
                            >
                              {formatAmountFromBase(bill.amountBase)}{" "}
                              {baseCurrency?.symbol || baseCurrency?.code || ""}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        )}

        {/* Wallet Balance Card */}
        {wallet && (
          <View
            style={{
              paddingHorizontal: scaleSpacing(20),
              marginBottom: scaleSpacing(24),
            }}
          >
            <LinearGradient
              colors={["#6366F1", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: scaleSpacing(16),
                padding: scaleSpacing(20),
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: scaleFont(14),
                      fontWeight: "600",
                      marginBottom: scaleSpacing(4),
                      opacity: 0.9,
                    }}
                  >
                    {t("dashboard.wallet", "Available Balance")}
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: scaleFont(28),
                      fontWeight: "700",
                    }}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.7}
                  >
                    {formatAmountFromBase(wallet.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                  </Text>
                </View>
                <Ionicons
                  name="wallet"
                  size={scaleSize(40)}
                  color="#FFFFFF"
                  style={{ opacity: 0.9 }}
                />
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Statistics Section */}
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
            {t("dashboard.statistics", "Statistics")}
          </Text>

          {/* Week vs Month Stats */}
          <View
            style={{
              flexDirection: "row",
              gap: scaleSpacing(12),
              marginBottom: scaleSpacing(16),
            }}
          >
            {/* Weekly Stats */}
            <View
              style={{
                flex: 1,
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(16),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSpacing(8),
                  marginBottom: scaleSpacing(12),
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={scaleSize(20)}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(12),
                    fontWeight: "600",
                  }}
                >
                  {t("dashboard.thisWeek", "This Week")}
                </Text>
              </View>
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                  fontWeight: "700",
                  marginBottom: scaleSpacing(4),
                }}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {formatAmountFromBase(weeklyTotals.expenses)} {baseCurrency?.symbol || baseCurrency?.code || ""}
              </Text>
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontSize: scaleFont(12),
                }}
              >
                {weeklyTotals.count} {t("dashboard.transactions", "transactions")}
              </Text>
            </View>

            {/* Monthly Stats */}
            <View
              style={{
                flex: 1,
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(16),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSpacing(8),
                  marginBottom: scaleSpacing(12),
                }}
              >
                <Ionicons
                  name="calendar"
                  size={scaleSize(20)}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(12),
                    fontWeight: "600",
                  }}
                >
                  {t("dashboard.thisMonth", "This Month")}
                </Text>
              </View>
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                  fontWeight: "700",
                  marginBottom: scaleSpacing(4),
                }}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {formatAmountFromBase(monthlyTotals.expenses)} {baseCurrency?.symbol || baseCurrency?.code || ""}
              </Text>
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontSize: scaleFont(12),
                }}
              >
                {monthlyTotals.count} {t("dashboard.transactions", "transactions")}
              </Text>
            </View>
          </View>

          {/* Additional Stats Row */}
          <View
            style={{
              flexDirection: "row",
              gap: scaleSpacing(12),
            }}
          >
            {/* Average Daily Expense */}
            <View
              style={{
                flex: 1,
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(16),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSpacing(8),
                  marginBottom: scaleSpacing(12),
                }}
              >
                <Ionicons
                  name="trending-down-outline"
                  size={scaleSize(20)}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(12),
                    fontWeight: "600",
                  }}
                >
                  {t("dashboard.avgDaily", "Avg Daily")}
                </Text>
              </View>
              <Text
                style={{
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                  fontWeight: "700",
                  marginBottom: scaleSpacing(4),
                }}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {formatAmountFromBase(averageDailyExpense)} {baseCurrency?.symbol || baseCurrency?.code || ""}
              </Text>
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontSize: scaleFont(12),
                }}
              >
                {t("dashboard.perDay", "per day")}
              </Text>
            </View>

            {/* Transaction Counts */}
            <View
              style={{
                flex: 1,
                borderRadius: scaleSpacing(12),
                padding: scaleSpacing(16),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSpacing(8),
                  marginBottom: scaleSpacing(12),
                }}
              >
                <Ionicons
                  name="list-outline"
                  size={scaleSize(20)}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(12),
                    fontWeight: "600",
                  }}
                >
                  {t("dashboard.activity", "Activity")}
                </Text>
              </View>
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: scaleFont(18),
                  fontWeight: "700",
                  marginBottom: scaleSpacing(4),
                }}
              >
                {monthlyTotals.expenseCount}
              </Text>
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontSize: scaleFont(12),
                }}
              >
                {t("dashboard.expenses", "Expenses")}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(20),
            marginBottom: scaleSpacing(24),
            gap: scaleSpacing(12),
          }}
        >
          {/* Income Card */}
          <LinearGradient
            colors={["#34D399", "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: scaleSpacing(16),
              padding: scaleSpacing(20),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scaleFont(14),
                    fontWeight: "600",
                    marginBottom: scaleSpacing(4),
                    opacity: 0.9,
                  }}
                >
                  {t("dashboard.income", "Income")}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scaleFont(22),
                    fontWeight: "700",
                  }}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.6}
                >
                  {formatAmountFromBase(monthlyTotals.income)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                </Text>
              </View>
              <Ionicons name="arrow-down-circle" size={scaleSize(32)} color="#FFFFFF" style={{ opacity: 0.9 }} />
            </View>
          </LinearGradient>

          {/* Expenses Card */}
          <LinearGradient
            colors={["#F87171", "#EF4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: scaleSpacing(16),
              padding: scaleSpacing(20),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scaleFont(14),
                    fontWeight: "600",
                    marginBottom: scaleSpacing(4),
                    opacity: 0.9,
                  }}
                >
                  {t("dashboard.expenses", "Expenses")}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: scaleFont(22),
                    fontWeight: "700",
                  }}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.6}
                >
                  {formatAmountFromBase(monthlyTotals.expenses)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                </Text>
              </View>
              <Ionicons name="arrow-up-circle" size={scaleSize(32)} color="#FFFFFF" style={{ opacity: 0.9 }} />
            </View>
          </LinearGradient>

          {/* Balance Card */}
          <View
            style={{
              borderRadius: scaleSpacing(16),
              padding: scaleSpacing(20),
              backgroundColor: isDark ? "#374151" : "#F9FAFB",
              borderWidth: 1.5,
              borderColor: isDark ? "#4B5563" : "#E5E7EB",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(14),
                    fontWeight: "600",
                    marginBottom: scaleSpacing(4),
                  }}
                >
                  {t("dashboard.balance", "Balance")}
                </Text>
                <Text
                  style={{
                    color:
                      monthlyTotals.balance >= 0
                        ? "#10B981"
                        : "#EF4444",
                    fontSize: scaleFont(22),
                    fontWeight: "700",
                  }}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.6}
                >
                  {monthlyTotals.balance >= 0 ? "+" : ""}
                  {formatAmountFromBase(Math.abs(monthlyTotals.balance))} {baseCurrency?.symbol || baseCurrency?.code || ""}
                </Text>
              </View>
              <Ionicons
                name={monthlyTotals.balance >= 0 ? "trending-up" : "trending-down"}
                size={scaleSize(32)}
                color={monthlyTotals.balance >= 0 ? "#10B981" : "#EF4444"}
              />
            </View>
          </View>
        </View>


        {/* Charts Section */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(20),
            marginBottom: scaleSpacing(24),
          }}
        >
          <MonthlyTrendsChart transactions={allTransactions} />
          <CategoryBreakdownChart
            transactions={transactions}
            categories={categories}
          />
        </View>

        {/* Wishlist Section */}
        <View style={{ marginBottom: scaleSpacing(24) }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: scaleSpacing(20),
              marginBottom: scaleSpacing(16),
            }}
          >
            <Text
              style={{
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(18),
                fontWeight: "700",
              }}
            >
              {t("dashboard.wishlist", "Wishlist")}
            </Text>
            <Pressable
              onPress={() => setShowWishlistForm(true)}
              style={{
                paddingHorizontal: scaleSpacing(12),
                paddingVertical: scaleSpacing(8),
                borderRadius: scaleSpacing(8),
                backgroundColor: isDark ? "#3B82F6" : "#2563EB",
              }}
            >
              <Ionicons name="add" size={scaleSize(20)} color="#FFFFFF" />
            </Pressable>
          </View>

          {plannedPurchases.length === 0 ? (
            <View
              style={{
                paddingVertical: scaleSpacing(40),
                paddingHorizontal: scaleSpacing(32),
                alignItems: "center",
              }}
            >
              <Ionicons
                name="heart-outline"
                size={scaleSize(48)}
                color={isDark ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontSize: scaleFont(16),
                  marginTop: scaleSpacing(12),
                  textAlign: "center",
                }}
              >
                {t("dashboard.wishlist.empty", "No planned purchases yet")}
              </Text>
              <Text
                style={{
                  color: isDark ? "#6B7280" : "#9CA3AF",
                  fontSize: scaleFont(14),
                  marginTop: scaleSpacing(4),
                  textAlign: "center",
                }}
              >
                {t("dashboard.wishlist.empty.subtitle", "Add items you want to buy")}
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: scaleSpacing(20) }}>
              {plannedPurchases.map((purchase) => {
                const category = categories.find((c) => c.id === purchase.categoryId);
                const priorityColor = PRIORITY_COLORS[purchase.priority];
                return (
                  <Pressable
                    key={purchase.id}
                    onPress={() => router.push("/(tabs)/wishlist")}
                    style={{
                      borderRadius: scaleSpacing(12),
                      padding: scaleSpacing(16),
                      backgroundColor: isDark ? "#374151" : "#FFFFFF",
                      borderWidth: 1.5,
                      borderColor: isDark ? "#4B5563" : "#E5E7EB",
                      marginBottom: scaleSpacing(12),
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: scaleSpacing(10),
                            marginBottom: scaleSpacing(8),
                          }}
                        >
                          {category && (
                            <Ionicons
                              name={category.icon as any}
                              size={scaleSize(20)}
                              color={category.color}
                            />
                          )}
                          <Text
                            style={{
                              color: isDark ? "#FFFFFF" : "#111827",
                              fontSize: scaleFont(16),
                              fontWeight: "600",
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {purchase.name}
                          </Text>
                          <View
                            style={{
                              paddingHorizontal: scaleSpacing(8),
                              paddingVertical: scaleSpacing(4),
                              borderRadius: scaleSpacing(6),
                              backgroundColor: priorityColor + "20",
                            }}
                          >
                            <Text
                              style={{
                                color: priorityColor,
                                fontSize: scaleFont(12),
                                fontWeight: "600",
                                textTransform: "capitalize",
                              }}
                            >
                              {t(`wishlist.priority.${purchase.priority}`, purchase.priority)}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            color: isDark ? "#9CA3AF" : "#6B7280",
                            fontSize: scaleFont(14),
                            fontWeight: "600",
                          }}
                        >
                          {formatAmountFromBase(purchase.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                        </Text>
                      </View>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          if (purchase.id) {
                            handleMarkAsPurchased(purchase.id);
                          }
                        }}
                        style={{
                          marginLeft: scaleSpacing(12),
                          padding: scaleSpacing(8),
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={scaleSize(24)}
                          color={priorityColor}
                        />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={{ marginBottom: scaleSpacing(24) }}>
            <Text
              style={{
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(18),
                fontWeight: "700",
                paddingHorizontal: scaleSpacing(20),
                marginBottom: scaleSpacing(16),
              }}
            >
              {t("dashboard.recent", "Recent Transactions")}
            </Text>
            {recentTransactions.map((item) => {
              const category = getCategory(item.categoryId || "");
              const isExpense = item.type === "expense";
              return (
                <Pressable
                  key={item.id}
                  style={{
                    paddingHorizontal: scaleSpacing(20),
                    marginBottom: scaleSpacing(8),
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: scaleSpacing(16),
                      borderRadius: scaleSpacing(12),
                      backgroundColor: isDark ? "#374151" : "#FFFFFF",
                      borderWidth: 1.5,
                      borderColor: isDark ? "#4B5563" : "#E5E7EB",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSpacing(12) }}>
                      <View
                        style={{
                          width: scaleSize(40),
                          height: scaleSize(40),
                          borderRadius: scaleSpacing(20),
                          backgroundColor: category ? category.color + "20" : isDark ? "#4B5563" : "#E5E7EB",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name={category ? (category.icon as any) : "help-outline"}
                          size={scaleSize(20)}
                          color={category ? category.color : isDark ? "#9CA3AF" : "#6B7280"}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: isDark ? "#FFFFFF" : "#111827",
                            fontSize: scaleFont(16),
                            fontWeight: "600",
                          }}
                        >
                          {category ? category.name : t("common.uncategorized", "Uncategorized")}
                        </Text>
                        <Text
                          style={{
                            color: isDark ? "#9CA3AF" : "#6B7280",
                            fontSize: scaleFont(12),
                          }}
                        >
                          {new Date(item.dateISO).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        color: isExpense ? "#EF4444" : "#10B981",
                        fontSize: scaleFont(16),
                        fontWeight: "700",
                      }}
                    >
                      {isExpense ? "-" : "+"}
                      {formatAmountFromBase(item.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {transactions.length === 0 && (
          <View
            style={{
              paddingVertical: scaleSpacing(60),
              paddingHorizontal: scaleSpacing(32),
              alignItems: "center",
            }}
          >
            <Ionicons
              name="grid-outline"
              size={scaleSize(64)}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />
            <Text
              style={{
                color: isDark ? "#F3F4F6" : "#111827",
                fontSize: scaleFont(18),
                fontWeight: "600",
                marginTop: scaleSpacing(16),
                textAlign: "center",
              }}
            >
              {t("dashboard.empty", "No transactions this month")}
            </Text>
            <Text
              style={{
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(14),
                marginTop: scaleSpacing(8),
                textAlign: "center",
              }}
            >
              {t("dashboard.empty.subtitle", "Add your first expense to get started")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Wishlist Form Modal */}
      <SimpleBottomSheet
        visible={showWishlistForm}
        onClose={() => setShowWishlistForm(false)}
      >
        <PlannedPurchaseForm
          onSuccess={() => {
            setShowWishlistForm(false);
            loadDashboardData();
          }}
          onCancel={() => setShowWishlistForm(false)}
        />
      </SimpleBottomSheet>

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
