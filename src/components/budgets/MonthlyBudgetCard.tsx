import { ThemeColors } from "@/src/constants/themeColors";
import { MonthlyBudget } from "@/src/features/budgets/types";
import { createTransactionsService } from "@/src/services/firestore/transactions.service";
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
        const transactionsService = createTransactionsService(user.uid);
        const transactions = await transactionsService.getAll([
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

  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  if (!budget) {
    return (
      <View
        style={{
          paddingHorizontal: scaleSpacing(20),
          marginBottom: scaleSpacing(24),
        }}
      >
        <Pressable onPress={onEdit}>
            <View
              style={{
                borderRadius: scaleSpacing(20),
                padding: scaleSpacing(20),
                backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surface,
                borderWidth: 1,
                borderColor: isDark ? ThemeColors.dark.borderLight : ThemeColors.light.borderLight,
                overflow: 'hidden'
              }}
            >
               {/* Decorative Background Graph */}
               <View style={{ 
                   flexDirection: 'row', 
                   alignItems: 'flex-end', 
                   justifyContent: 'space-between', 
                   height: scaleSize(50), 
                   marginBottom: scaleSpacing(16),
                   paddingHorizontal: scaleSpacing(8)
               }}>
                   {[0.3, 0.5, 0.4, 0.7, 0.5, 0.8, 0.6].map((h, i) => (
                       <View key={i} style={{
                           width: scaleSize(6),
                           height: `${h * 100}%`,
                           backgroundColor: isDark ? ThemeColors.dark.primary : ThemeColors.light.primary,
                           borderRadius: scaleSize(4),
                           opacity: 0.2 + (i * 0.1)
                       }} />
                   ))}
                   
                   {/* Target Line Decoration */}
                   <View style={{
                       position: 'absolute',
                       top: '30%',
                       left: 0,
                       right: 0,
                       height: 1,
                       backgroundColor: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                       opacity: 0.2,
                       borderStyle: 'dashed',
                       borderWidth: 1,
                       borderColor: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                   }} />
               </View>

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
                        color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                        fontSize: scaleFont(16),
                        fontWeight: "700",
                        marginBottom: 4
                    }}
                    >
                    {t("budget.setMonthly", "Set Monthly Budget")}
                    </Text>
                     <Text
                    style={{
                        color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                        fontSize: scaleFont(12),
                        opacity: 0.8
                    }}
                    >
                    {t("budget.visualize", "Visualize your spending limits")}
                    </Text>
                </View>

                <View style={{
                    backgroundColor: isDark ? ThemeColors.dark.primary : ThemeColors.light.primary,
                    width: scaleSize(36),
                    height: scaleSize(36),
                    borderRadius: scaleSize(12),
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isDark ? ThemeColors.dark.primary : ThemeColors.light.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4
                }}>
                    <Ionicons
                    name="add"
                    size={scaleSize(20)}
                    color="#FFFFFF"
                    />
                </View>
              </View>
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
              ? (isDark ? ThemeColors.dark.gradients.error : ThemeColors.light.gradients.error)
              : isWarning
                ? (isDark ? ThemeColors.dark.gradients.warning : ThemeColors.light.gradients.warning)
                : (isDark ? ThemeColors.dark.gradients.success : ThemeColors.light.gradients.success)
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

