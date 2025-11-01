import { Transaction } from "@/src/features/transactions/types";
import { useTheme } from "@/src/state/ThemeProvider";
import { useResponsive } from "@/src/utils/responsive";
import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, Text, View } from "react-native";

// Conditionally import chart library
let LineChart: any = null;
try {
  const chartKit = require("react-native-chart-kit");
  LineChart = chartKit.LineChart;
} catch (error) {
  // Library not installed yet
  console.warn("react-native-chart-kit not installed");
}

interface MonthlyTrendsChartProps {
  transactions: Transaction[];
}

export function MonthlyTrendsChart({ transactions }: MonthlyTrendsChartProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleFont } = useResponsive();

  // Group transactions by month and calculate totals
  const monthlyData = React.useMemo(() => {
    const grouped: { [key: string]: number } = {};

    transactions.forEach((txn) => {
      if (txn.type === "expense") {
        const date = new Date(txn.dateISO);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const amount = txn.amountBase / 100; // Convert from smallest unit

        if (!grouped[monthKey]) {
          grouped[monthKey] = 0;
        }
        grouped[monthKey] += amount;
      }
    });

    // Sort by month key and get last 6 months
    const sortedKeys = Object.keys(grouped).sort().slice(-6);
    
    return sortedKeys.map((key) => ({
      month: key,
      total: grouped[key],
    }));
  }, [transactions]);

  // If no data, show empty state
  if (monthlyData.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            padding: scaleSpacing(20),
            backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
            borderRadius: scaleSpacing(16),
            marginBottom: scaleSpacing(12),
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
          {t("dashboard.charts.noData", "No spending data available")}
        </Text>
      </View>
    );
  }

  // Prepare data for chart
  const labels = monthlyData.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short" });
  });

  const data = monthlyData.map((item) => item.total);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - scaleSpacing(80); // Account for padding

  const chartConfig = {
    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
    backgroundGradientFrom: isDark ? "#1F2937" : "#FFFFFF",
    backgroundGradientTo: isDark ? "#1F2937" : "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => {
      if (isDark) {
        return `rgba(239, 68, 68, ${opacity})`; // Red for expenses in dark mode
      }
      return `rgba(239, 68, 68, ${opacity})`; // Red for expenses in light mode
    },
    labelColor: (opacity = 1) => {
      if (isDark) {
        return `rgba(156, 163, 175, ${opacity})`;
      }
      return `rgba(107, 114, 128, ${opacity})`;
    },
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: isDark ? "#374151" : "#E5E7EB",
      strokeWidth: 1,
    },
  };

  // If chart library not available, show placeholder
  if (!LineChart) {
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
          {t("dashboard.charts.monthlyTrends", "Monthly Spending Trends")}
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

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          borderRadius: scaleSpacing(16),
          padding: scaleSpacing(16),
          marginBottom: scaleSpacing(12),
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
        {t("dashboard.charts.monthlyTrends", "Monthly Spending Trends")}
      </Text>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data,
            },
          ],
        }}
        width={chartWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: scaleSpacing(8),
          borderRadius: scaleSpacing(12),
        }}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero={false}
      />
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

