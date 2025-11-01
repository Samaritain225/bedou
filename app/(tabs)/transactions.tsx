import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EditTransactionForm } from "@/src/components/forms/EditTransactionForm";
import { DeleteModal } from "@/src/components/ui/DeleteModal";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { TransactionDetailsModal } from "@/src/components/ui/TransactionDetailsModal";
import { useDb } from "@/src/db/hooks";
import {
  deleteTransaction,
  listTransactions,
} from "@/src/features/transactions/repository";
import { Transaction } from "@/src/features/transactions/types";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useWallet } from "@/src/state/WalletProvider";
import { useResponsive } from "@/src/utils/responsive";

interface GroupedTransaction {
  date: string;
  dateLabel: string;
  transactions: Transaction[];
}

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const db = useDb();
  const { categories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { adjustWalletBalance } = useWallet();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const txns = await listTransactions(db);
      setTransactions(Array.isArray(txns) ? txns : []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
  }, [loadTransactions]);

  const formatAmount = (amountBase: number): string => {
    const amount = amountBase / 100;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = useCallback(
    (dateISO: string): string => {
      const date = new Date(dateISO);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) {
        return t("transactions.today", "Today");
      } else if (isYesterday) {
        return t("transactions.yesterday", "Yesterday");
      } else {
        return new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);
      }
    },
    [t]
  );

  const groupTransactionsByDate = useMemo(() => {
    const grouped: { [key: string]: Transaction[] } = {};
    transactions.forEach((txn) => {
      const dateKey = txn.dateISO.split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(txn);
    });

    const result: GroupedTransaction[] = Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => {
        const firstTxn = grouped[dateKey][0];
        return {
          date: dateKey,
          dateLabel: formatDate(firstTxn.dateISO),
          transactions: grouped[dateKey],
        };
      });

    return result;
  }, [transactions, formatDate]);

  const getCategory = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((cat) => cat.id === categoryId) || null;
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsModalVisible(true);
  };

  const handleEdit = () => {
    setDetailsModalVisible(false);
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    setDetailsModalVisible(false);
    setDeleteModalVisible(true);
  };

  const handleUpdateTransaction = async () => {
    await loadTransactions();
    setEditModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return;

    setIsDeleting(true);
    try {
      // Reverse wallet adjustment: if expense was deducted, add it back; if income was added, deduct it
      const amountDelta = selectedTransaction.type === "expense"
        ? selectedTransaction.amountBase  // Reverse expense: add back
        : -selectedTransaction.amountBase; // Reverse income: deduct
      
      await adjustWalletBalance(amountDelta, selectedTransaction.currencyCode);
      await deleteTransaction(selectedTransaction.id, db);
      await loadTransactions();
      setDeleteModalVisible(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = getCategory(item.categoryId);
    const amount = formatAmount(item.amountBase);
    const isExpense = item.type === "expense";

    return (
      <Pressable
        style={[
          styles.transactionItem,
          {
            backgroundColor: isDark ? "#374151" : "#FFFFFF",
            borderColor: isDark ? "#4B5563" : "#E5E7EB",
            paddingHorizontal: scaleSpacing(16),
            paddingVertical: scaleSpacing(14),
            borderRadius: scaleSpacing(12),
            marginBottom: scaleSpacing(8),
          },
        ]}
        onPress={() => handleTransactionPress(item)}
      >
        <View
          style={{
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
            {item.note && (
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontSize: scaleFont(14),
                }}
                numberOfLines={1}
              >
                {item.note}
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
            {amount} {baseCurrency?.symbol || baseCurrency?.code || ""}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderSection = ({ item }: { item: GroupedTransaction }) => (
    <View style={{ marginBottom: scaleSpacing(24) }}>
      <Text
        style={{
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: scaleFont(14),
          fontWeight: "600",
          marginBottom: scaleSpacing(12),
          paddingHorizontal: scaleSpacing(20),
        }}
      >
        {item.dateLabel}
      </Text>
      {item.transactions.map((txn) => (
        <View key={txn.id} style={{ paddingHorizontal: scaleSpacing(20) }}>
          {renderTransaction({ item: txn })}
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View
      style={[
        styles.emptyContainer,
        {
          paddingTop: scaleSpacing(60),
        },
      ]}
    >
      <Ionicons
        name="list-outline"
        size={scaleSize(64)}
        color={isDark ? "#6B7280" : "#9CA3AF"}
      />
      <Text
        style={{
          color: isDark ? "#F3F4F6" : "#111827",
          fontSize: scaleFont(18),
          fontWeight: "600",
          marginTop: scaleSpacing(16),
        }}
      >
        {t("transactions.empty")}
      </Text>
      <Text
        style={{
          color: isDark ? "#9CA3AF" : "#6B7280",
          fontSize: scaleFont(14),
          marginTop: scaleSpacing(8),
          textAlign: "center",
          paddingHorizontal: scaleSpacing(32),
        }}
      >
        {t("transactions.empty.subtitle", "Add your first expense to get started")}
      </Text>
    </View>
  );

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
      <FlatList
        data={groupTransactionsByDate}
        renderItem={renderSection}
        keyExtractor={(item) => item.date}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingVertical: scaleSpacing(20),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#3B82F6" : "#2563EB"}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        visible={detailsModalVisible}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        category={selectedTransaction ? getCategory(selectedTransaction.categoryId) : null}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Transaction Modal */}
      <SimpleBottomSheet
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedTransaction(null);
        }}
      >
        {selectedTransaction && (
          <EditTransactionForm
            initialTransaction={selectedTransaction}
            onClose={() => {
              setEditModalVisible(false);
              setSelectedTransaction(null);
            }}
            onSuccess={handleUpdateTransaction}
          />
        )}
      </SimpleBottomSheet>

      {/* Delete Modal */}
      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          if (!isDeleting) {
            setSelectedTransaction(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={t("transactions.deleteTitle", "Delete Transaction")}
        message={
          selectedTransaction
            ? t("transactions.deleteMessage", {
                amount: formatAmount(selectedTransaction.amountBase),
                currency: baseCurrency?.symbol || baseCurrency?.code || "",
              }) ||
              `Are you sure you want to delete this transaction? This action cannot be undone.`
            : ""
        }
        confirmLabel={t("common.delete", "Delete")}
        isLoading={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  transactionItem: {
    borderWidth: 1.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
