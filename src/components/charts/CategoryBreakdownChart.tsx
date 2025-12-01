import { Category } from "@/src/features/categories/types";
import { useTheme } from "@/src/state/ThemeProvider";
import { TransactionDocument } from "@/src/types/firestore";
import { useResponsive } from "@/src/utils/responsive";
import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, Text, View } from "react-native";

// Conditionally import chart library
let PieChart: any = null;
try {
  const chartKit = require("react-native-chart-kit");
  PieChart = chartKit.PieChart;
} catch (error) {
  // Library not installed yet
  console.warn("react-native-chart-kit not installed");
}

interface CategoryBreakdownChartProps {
  transactions: TransactionDocument[];
  categories: Category[];
}

export function CategoryBreakdownChart({
  transactions,
  categories,
}: CategoryBreakdownChartProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleFont } = useResponsive();

  // Calculate spending by category
  const categoryData = React.useMemo(() => {
    const spending: { [categoryId: string]: number } = {};

    transactions.forEach((txn) => {
      if (txn.type === "expense" && txn.categoryId) {
        const amount = txn.amountBase / 100; // Convert from smallest unit
        if (!spending[txn.categoryId]) {
          spending[txn.categoryId] = 0;
        }
        spending[txn.categoryId] += amount;
      }
    });

    // Convert to array and filter out zero spending
    const data = Object.entries(spending)
      .filter(([_, amount]) => amount > 0)
      .map(([categoryId, amount]) => {
        const category = categories.find((cat) => cat.id === categoryId);
        return {
          name: category?.name || t("transactions.uncategorized", "Uncategorized"),
          amount,
          color: category?.color || (isDark ? "#6B7280" : "#9CA3AF"),
          legendFontColor: isDark ? "#FFFFFF" : "#111827",
          legendFontSize: scaleFont(12),
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories

    return data;
  }, [transactions, categories, isDark, t, scaleFont]);

  // If no data, show empty state
  if (categoryData.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            padding: scaleSpacing(20),
            backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
            borderRadius: scaleSpacing(16),
            marginBottom: scaleSpacing(16),
          },
        ]}
      >
        <Text
          style={{
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontSize: scaleFont(14),
            textAlign: "center",
          }}
        >
          {t("dashboard.charts.noCategoryData", "No category spending data available")}
        </Text>
      </View>
    );
  }

  // If chart library not available, show placeholder
  if (!PieChart) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(20),
            marginBottom: scaleSpacing(16),
          },
        ]}
      >
        <Text
          style={{
            color: isDark ? "#FFFFFF" : "#111827",
            fontSize: scaleFont(18),
            fontWeight: "700",
            marginBottom: scaleSpacing(8),
          }}
        >
          {t("dashboard.charts.categoryBreakdown", "Spending by Category")}
        </Text>
        <Text
          style={{
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontSize: scaleFont(14),
            textAlign: "center",
          }}
        >
          {t("dashboard.charts.libraryNotInstalled", "Chart library not installed. Please install react-native-chart-kit.")}
        </Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;
  const chartSize = screenWidth - scaleSpacing(80); // Account for padding

  const chartConfig = {
    color: (opacity = 1) => {
      if (isDark) {
        return `rgba(255, 255, 255, ${opacity})`;
      }
      return `rgba(0, 0, 0, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      if (isDark) {
        return `rgba(156, 163, 175, ${opacity})`;
      }
      return `rgba(107, 114, 128, ${opacity})`;
    },
    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
    backgroundGradientFrom: isDark ? "#1F2937" : "#FFFFFF",
    backgroundGradientTo: isDark ? "#1F2937" : "#FFFFFF",
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          borderRadius: scaleSpacing(16),
          padding: scaleSpacing(16),
          marginBottom: scaleSpacing(16),
        },
      ]}
    >
      <Text
        style={{
          color: isDark ? "#FFFFFF" : "#111827",
          fontSize: scaleFont(18),
          fontWeight: "700",
          marginBottom: scaleSpacing(16),
        }}
      >
        {t("dashboard.charts.categoryBreakdown", "Spending by Category")}
      </Text>
      <View style={{ alignItems: "center" }}>
        <PieChart
          data={categoryData}
          width={chartSize}
          height={220}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft={scaleSpacing(15)}
          absolute={false}
          style={{
            marginVertical: scaleSpacing(8),
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

