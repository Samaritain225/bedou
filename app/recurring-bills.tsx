import { RecurringBillForm } from "@/src/components/forms/RecurringBillForm";
import { DeleteModal } from "@/src/components/ui/DeleteModal";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { useDb } from "@/src/db/hooks";
import {
    deleteRecurringBill,
    listRecurringBills,
    updateRecurringBill,
} from "@/src/features/recurring-bills/repository";
import { RecurringBill } from "@/src/features/recurring-bills/types";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { formatAmountFromBase } from "@/src/utils/format";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "all" | "active" | "inactive";

export default function RecurringBillsScreen() {
  const { t } = useTranslation();
  const db = useDb();
  const { categories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRecurringBills = useCallback(async () => {
    try {
      const bills = await listRecurringBills(db);
      setRecurringBills(Array.isArray(bills) ? bills : []);
    } catch (error) {
      console.error("Error loading recurring bills:", error);
      setRecurringBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadRecurringBills();
    }, [loadRecurringBills])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecurringBills();
  }, [loadRecurringBills]);

  const handleToggleActive = useCallback(async (bill: RecurringBill) => {
    try {
      await updateRecurringBill(bill.id, { isActive: !bill.isActive }, db);
      await loadRecurringBills();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error toggling bill status:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [db, loadRecurringBills]);

  const handleEdit = useCallback((bill: RecurringBill) => {
    setSelectedBill(bill);
    setShowEditForm(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedBill) {
      setDeleteModalVisible(true);
    }
  }, [selectedBill]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedBill) return;

    setIsDeleting(true);
    try {
      await deleteRecurringBill(selectedBill.id, db);
      await loadRecurringBills();
      setDeleteModalVisible(false);
      setSelectedBill(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to delete recurring bill:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedBill, db, loadRecurringBills]);

  const filteredBills = useMemo(() => {
    let filtered = [...recurringBills];

    // Apply filter
    if (filter === "active") {
      filtered = filtered.filter((b) => b.isActive === 1);
    } else if (filter === "inactive") {
      filtered = filtered.filter((b) => b.isActive === 0);
    }

    // Sort by next due date (earliest first), then by name
    filtered.sort((a, b) => {
      const dateA = new Date(a.nextDueDate).getTime();
      const dateB = new Date(b.nextDueDate).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [recurringBills, filter]);

  const formatDueDate = (dateISO: string): string => {
    const date = new Date(dateISO);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return t("recurring.overdue", "Overdue");
    } else if (diffDays === 0) {
      return t("recurring.dueToday", "Due today");
    } else if (diffDays === 1) {
      return t("recurring.dueTomorrow", "Due tomorrow");
    } else if (diffDays <= 7) {
      return t("recurring.dueInDays", `Due in ${diffDays} days`, { count: diffDays });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getFrequencyLabel = (frequency: string): string => {
    return t(`recurring.frequency.${frequency}`, frequency);
  };

  const renderBillItem = ({ item: bill }: { item: RecurringBill }) => {
    const category = bill.categoryId
      ? categories.find((c) => c.id === bill.categoryId)
      : null;
    const isOverdue = new Date(bill.nextDueDate) < new Date();

    return (
      <Pressable
        onPress={() => handleEdit(bill)}
        style={({ pressed }) => [
          styles.billItem,
          {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            opacity: pressed ? 0.8 : 1,
            borderLeftColor: category?.color || "#6B7280",
            borderLeftWidth: 4,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: scaleSpacing(8),
            }}
          >
            <Text
              style={[
                styles.billName,
                {
                  color: isDark ? "#FFFFFF" : "#111827",
                  fontSize: scaleFont(16),
                  fontWeight: "600",
                  flex: 1,
                },
              ]}
              numberOfLines={1}
            >
              {bill.name}
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleToggleActive(bill);
              }}
              style={{
                padding: scaleSpacing(4),
                marginLeft: scaleSpacing(8),
              }}
            >
              <Ionicons
                name={bill.isActive ? "toggle" : "toggle-outline"}
                size={scaleSize(20)}
                color={bill.isActive ? "#10B981" : "#9CA3AF"}
              />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: scaleSpacing(12),
              marginBottom: scaleSpacing(4),
            }}
          >
            {category && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSpacing(6),
                }}
              >
                <Ionicons
                  name={category.icon as any}
                  size={scaleSize(14)}
                  color={category.color}
                />
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontSize: scaleFont(12),
                  }}
                >
                  {category.name}
                </Text>
              </View>
            )}
            <Text
              style={{
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(12),
              }}
            >
              {getFrequencyLabel(bill.frequency)}
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
                color: isOverdue ? "#EF4444" : isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(14),
                fontWeight: "500",
              }}
            >
              {formatDueDate(bill.nextDueDate)}
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
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
        <ActivityIndicator size="large" color={isDark ? "#3B82F6" : "#2563EB"} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: scaleSpacing(20),
          paddingTop: Math.max(scaleSpacing(20), insets.top),
          paddingBottom: scaleSpacing(16),
          flexDirection: "row",
          alignItems: "center",
          gap: scaleSpacing(16),
          backgroundColor: isDark ? "#111827" : "#F9FAFB",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            padding: scaleSpacing(8),
          }}
        >
          <Ionicons
            name="arrow-back"
            size={scaleSize(24)}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
        </Pressable>
        <Text
          style={{
            color: isDark ? "#FFFFFF" : "#111827",
            fontSize: scaleFont(24),
            fontWeight: "700",
            flex: 1,
          }}
        >
          {t("recurring.title", "Recurring Bills")}
        </Text>
      </View>

      {/* Filter Buttons */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: scaleSpacing(20),
          paddingBottom: scaleSpacing(12),
          gap: scaleSpacing(8),
        }}
      >
        {(["all", "active", "inactive"] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: scaleSpacing(16),
              paddingVertical: scaleSpacing(8),
              borderRadius: scaleSpacing(20),
              backgroundColor:
                filter === f
                  ? isDark
                    ? "#3B82F6"
                    : "#2563EB"
                  : isDark
                    ? "#374151"
                    : "#E5E7EB",
            }}
          >
            <Text
              style={{
                color:
                  filter === f
                    ? "#FFFFFF"
                    : isDark
                      ? "#9CA3AF"
                      : "#6B7280",
                fontSize: scaleFont(14),
                fontWeight: "600",
              }}
            >
              {t(`recurring.filter.${f}`, f)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bills List */}
      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.id}
        renderItem={renderBillItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View
            style={{
              padding: scaleSpacing(40),
              alignItems: "center",
            }}
          >
            <Ionicons
              name="receipt-outline"
              size={scaleSize(48)}
              color={isDark ? "#4B5563" : "#9CA3AF"}
            />
            <Text
              style={{
                marginTop: scaleSpacing(16),
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(16),
                textAlign: "center",
              }}
            >
              {t("recurring.noBills", "No recurring bills yet")}
            </Text>
          </View>
        }
        contentContainerStyle={{
          padding: scaleSpacing(20),
          paddingBottom: scaleSpacing(100),
        }}
      />

      {/* Add Button */}
      <Pressable
        onPress={() => {
          setSelectedBill(null);
          setShowAddForm(true);
        }}
        style={[
          styles.addButton,
          {
            backgroundColor: isDark ? "#3B82F6" : "#2563EB",
          },
        ]}
      >
        <Ionicons name="add" size={scaleSize(24)} color="#FFFFFF" />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: scaleFont(16),
            fontWeight: "600",
            marginLeft: scaleSpacing(8),
          }}
        >
          {t("recurring.addBill", "Add Bill")}
        </Text>
      </Pressable>

      {/* Add/Edit Form */}
      <SimpleBottomSheet
        visible={showAddForm || showEditForm}
        onClose={() => {
          setShowAddForm(false);
          setShowEditForm(false);
          setSelectedBill(null);
        }}
      >
        <RecurringBillForm
          initialBill={selectedBill || undefined}
          onSuccess={() => {
            setShowAddForm(false);
            setShowEditForm(false);
            setSelectedBill(null);
            loadRecurringBills();
          }}
          onCancel={() => {
            setShowAddForm(false);
            setShowEditForm(false);
            setSelectedBill(null);
          }}
        />
      </SimpleBottomSheet>

      {/* Delete Modal */}
      <DeleteModal
        visible={deleteModalVisible}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedBill(null);
        }}
        title={t("recurring.deleteTitle", "Delete Recurring Bill")}
        message={t(
          "recurring.deleteMessage",
          "Are you sure you want to delete this recurring bill? This action cannot be undone."
        )}
        isLoading={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  billItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  billName: {
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

