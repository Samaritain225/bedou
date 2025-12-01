import { MonthlyBudget } from "@/src/features/budgets/types";
import { transactionsService } from "@/src/services/firestore/transactions.service";
import { useAuth } from "@/src/state/AuthProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { getCurrentMonthYYYYMM, yyyymmToDate } from "@/src/utils/dateHelpers";
import { formatAmountFromBase } from "@/src/utils/format";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface MonthlyBudgetCardProps {
  budget: MonthlyBudget | null;
  onEdit: () => void;
}

export function MonthlyBudgetCard({ budget, onEdit }: MonthlyBudgetCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const { baseCurrency } = useCurrency();
  // const db = useDb(); // REMOVED

  const [spent, setSpent] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth(); // Added useAuth

  const currentMonth = useMemo(() => getCurrentMonthYYYYMM(), []);

  React.useEffect(() => {
    async function loadSpending() {
      if (!budget || budget.monthYYYYMM !== currentMonth || !user) {
        setSpent(0);
        setLoading(false);
        return;
      }

      try {
        const { startDate, endDate } = (() => {
          const date = yyyymmToDate(budget.monthYYYYMM);
          const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
          const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
          return { startDate, endDate };
        })();

        // Use transactionsService instead of listTransactions
        const transactions = await transactionsService.getAll([
          ['userId', '==', user.uid],
          ['type', '==', 'expense'],
          ['dateISO', '>=', startDate],
          ['dateISO', '<=', endDate],
        ]);

        const totalSpent = transactions.reduce((sum, txn) => sum + txn.amountBase, 0);
        setSpent(totalSpent);
      } catch (error) {
        console.error("Error loading spending:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSpending();
  }, [budget, currentMonth, user]);

  if (!budget) {
    return (
      <View
        style={{
          paddingHorizontal: scaleSpacing(20),
          marginBottom: scaleSpacing(24),
        }}
      >
        <Pressable
          onPress={onEdit}
          style={{
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(20),
            backgroundColor: isDark ? "#374151" : "#FFFFFF",
            borderWidth: 1.5,
            borderColor: isDark ? "#4B5563" : "#E5E7EB",
            borderStyle: "dashed",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: scaleSpacing(12),
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={scaleSize(24)}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <Text
              style={{
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(16),
                fontWeight: "600",
              }}
            >
              {t("budget.setMonthly", "Set Monthly Budget")}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }

  const remaining = budget.amountBase - spent;
  const percentage = budget.amountBase > 0 ? (spent / budget.amountBase) * 100 : 0;
  const isOverBudget = remaining < 0;
  const isWarning = percentage >= 80;

  return (
    <View
      style={{
        paddingHorizontal: scaleSpacing(20),
        marginBottom: scaleSpacing(24),
      }}
    >
      <Pressable onPress={onEdit}>
        <LinearGradient
          colors={
            isOverBudget
              ? ["#EF4444", "#DC2626"]
              : isWarning
                ? ["#F59E0B", "#D97706"]
                : ["#10B981", "#059669"]
          }
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
              marginBottom: scaleSpacing(16),
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
                {t("budget.monthly", "Monthly Budget")}
              </Text>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: scaleFont(24),
                  fontWeight: "700",
                }}
              >
                {formatAmountFromBase(budget.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
              </Text>
            </View>
            <Ionicons
              name="wallet"
              size={scaleSize(32)}
              color="#FFFFFF"
              style={{ opacity: 0.9 }}
            />
          </View>

          {!loading && (
            <>
              {/* Progress Bar */}
              <View
                style={{
                  height: scaleSpacing(8),
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: scaleSpacing(4),
                  marginBottom: scaleSpacing(12),
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: "#FFFFFF",
                    borderRadius: scaleSpacing(4),
                  }}
                />
              </View>

              {/* Spent and Remaining */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: scaleFont(12),
                      opacity: 0.8,
                      marginBottom: scaleSpacing(2),
                    }}
                  >
                    {t("budget.spent", "Spent")}
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: scaleFont(16),
                      fontWeight: "600",
                    }}
                  >
                    {formatAmountFromBase(spent)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: scaleFont(12),
                      opacity: 0.8,
                      marginBottom: scaleSpacing(2),
                    }}
                  >
                    {isOverBudget
                      ? t("budget.overBudget", "Over Budget")
                      : t("budget.remaining", "Remaining")}
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: scaleFont(16),
                      fontWeight: "600",
                    }}
                  >
                    {formatAmountFromBase(Math.abs(remaining))} {baseCurrency?.symbol || baseCurrency?.code || ""}
                  </Text>
                </View>
              </View>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

