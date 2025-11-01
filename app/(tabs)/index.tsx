import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { useDb } from "../../src/db/hooks";
import { listTransactions } from "../../src/features/transactions/repository";
import { Transaction } from "../../src/features/transactions/types";
import { useCategories } from "../../src/state/CategoriesProvider";
import { useCurrency } from "../../src/state/CurrencyProvider";
import { useTheme } from "../../src/state/ThemeProvider";
import { useResponsive } from "../../src/utils/responsive";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const db = useDb();
  const { categories, budgets, currentMonth } = useCategories();
  const { baseCurrency } = useCurrency();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get current month range
  const getMonthRange = useCallback((monthYYYYMM: string) => {
    const year = parseInt(monthYYYYMM.substring(0, 4));
    const month = parseInt(monthYYYYMM.substring(4, 6)) - 1;
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
    try {
      // Load month transactions
      const { startDate, endDate } = getMonthRange(currentMonth);
      const txns = await listTransactions(db, {
        startDate,
        endDate,
      });
      setTransactions(Array.isArray(txns) ? txns : []);

      // Load all transactions for stats
      const allTxns = await listTransactions(db);
      setAllTransactions(Array.isArray(allTxns) ? allTxns : []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setTransactions([]);
      setAllTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db, currentMonth, getMonthRange]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
  }, [loadDashboardData]);

  const formatAmount = (amountBase: number): string => {
    const amount = amountBase / 100;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // All transactions for week and month calculations
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

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
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amountBase, 0);
    const balance = income - expenses;
    const count = transactions.length;
    const expenseCount = transactions.filter((t) => t.type === "expense").length;
    const incomeCount = transactions.filter((t) => t.type === "income").length;

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

  // Get category spending
  const categorySpending = useMemo(() => {
    const spending: { [categoryId: string]: number } = {};
    transactions
      .filter((t) => t.type === "expense" && t.categoryId)
      .forEach((t) => {
        spending[t.categoryId!] = (spending[t.categoryId!] || 0) + t.amountBase;
      });
    return spending;
  }, [transactions]);

  // Get budget progress for categories
  const budgetProgress = useMemo(() => {
    return budgets.map((budget) => {
      const spent = categorySpending[budget.categoryId] || 0;
      const percentage = Math.min((spent / budget.amountBase) * 100, 100);
      const category = categories.find((c) => c.id === budget.categoryId);
      return {
        ...budget,
        spent,
        percentage,
        category,
      };
    });
  }, [budgets, categorySpending, categories]);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const getCategory = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((cat) => cat.id === categoryId) || null;
  };

  const formatMonthLabel = (monthYYYYMM: string): string => {
    const year = parseInt(monthYYYYMM.substring(0, 4));
    const month = parseInt(monthYYYYMM.substring(4, 6)) - 1;
    return new Date(year, month, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

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
                {formatAmount(weeklyTotals.expenses)} {baseCurrency?.symbol || baseCurrency?.code || ""}
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
                {formatAmount(monthlyTotals.expenses)} {baseCurrency?.symbol || baseCurrency?.code || ""}
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
                {formatAmount(averageDailyExpense)} {baseCurrency?.symbol || baseCurrency?.code || ""}
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
                  {formatAmount(monthlyTotals.income)} {baseCurrency?.symbol || baseCurrency?.code || ""}
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
                  {formatAmount(monthlyTotals.expenses)} {baseCurrency?.symbol || baseCurrency?.code || ""}
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
                  {formatAmount(Math.abs(monthlyTotals.balance))} {baseCurrency?.symbol || baseCurrency?.code || ""}
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

        {/* Budget Progress */}
        {budgetProgress.length > 0 && (
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
              {t("dashboard.budgets", "Budgets")}
            </Text>
            {budgetProgress.map((budget) => {
              if (!budget.category) return null;
              return (
                <View
                  key={budget.id}
                  style={{
                    paddingHorizontal: scaleSpacing(20),
                    marginBottom: scaleSpacing(12),
                  }}
                >
                  <View
                    style={{
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
                        justifyContent: "space-between",
                        marginBottom: scaleSpacing(12),
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: scaleSpacing(10),
                        }}
                      >
                        <View
                          style={{
                            borderRadius: scaleSpacing(8),
                            padding: scaleSpacing(8),
                            backgroundColor: budget.category.color + "20",
                          }}
                        >
                          <Ionicons
                            name={budget.category.icon as any}
                            size={scaleSize(20)}
                            color={budget.category.color}
                          />
                        </View>
                        <Text
                          style={{
                            color: isDark ? "#FFFFFF" : "#111827",
                            fontSize: scaleFont(16),
                            fontWeight: "600",
                          }}
                        >
                          {budget.category.name}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: budget.percentage > 100 ? "#EF4444" : isDark ? "#9CA3AF" : "#6B7280",
                          fontSize: scaleFont(14),
                          fontWeight: "600",
                        }}
                      >
                        {formatAmount(budget.spent)} {baseCurrency?.symbol || baseCurrency?.code || ""} / {formatAmount(budget.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                      </Text>
                    </View>
                    {/* Progress Bar */}
                    <View
                      style={{
                        height: scaleSize(8),
                        borderRadius: scaleSize(4),
                        backgroundColor: isDark ? "#4B5563" : "#E5E7EB",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${Math.min(budget.percentage, 100)}%`,
                          backgroundColor:
                            budget.percentage > 100
                              ? "#EF4444"
                              : budget.percentage > 80
                                ? "#F59E0B"
                                : budget.category.color,
                          borderRadius: scaleSize(4),
                        }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
            {recentTransactions.map((txn) => {
              const category = getCategory(txn.categoryId);
              const isExpense = txn.type === "expense";
              return (
                <Pressable
                  key={txn.id}
                  style={{
                    paddingHorizontal: scaleSpacing(20),
                    marginBottom: scaleSpacing(8),
                  }}
                >
                  <View
                    style={{
                      borderRadius: scaleSpacing(12),
                      padding: scaleSpacing(14),
                      backgroundColor: isDark ? "#374151" : "#FFFFFF",
                      borderWidth: 1.5,
                      borderColor: isDark ? "#4B5563" : "#E5E7EB",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scaleSpacing(12),
                    }}
                  >
                    {category ? (
                      <View
                        style={{
                          borderRadius: scaleSpacing(8),
                          padding: scaleSpacing(8),
                          backgroundColor: category.color + "20",
                        }}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={scaleSize(24)}
                          color={category.color}
                        />
                      </View>
                    ) : (
                      <View
                        style={{
                          borderRadius: scaleSpacing(8),
                          padding: scaleSpacing(8),
                          backgroundColor: isDark ? "#4B5563" : "#F3F4F6",
                        }}
                      >
                        <Ionicons
                          name="ellipse-outline"
                          size={scaleSize(24)}
                          color={isDark ? "#9CA3AF" : "#6B7280"}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: scaleFont(16),
                          fontWeight: "600",
                          marginBottom: scaleSpacing(4),
                        }}
                      >
                        {category?.name || t("transactions.uncategorized", "Uncategorized")}
                      </Text>
                      {txn.note && (
                        <Text
                          style={{
                            color: isDark ? "#9CA3AF" : "#6B7280",
                            fontSize: scaleFont(14),
                          }}
                          numberOfLines={1}
                        >
                          {txn.note}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{
                        color: isExpense ? "#EF4444" : "#10B981",
                        fontSize: scaleFont(16),
                        fontWeight: "700",
                      }}
                    >
                      {isExpense ? "-" : "+"}
                      {formatAmount(txn.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
