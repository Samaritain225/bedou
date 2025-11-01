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
import { PlannedPurchaseForm } from "@/src/components/forms/PlannedPurchaseForm";
import { DeleteModal } from "@/src/components/ui/DeleteModal";
import { SimpleBottomSheet } from "@/src/components/ui/SimpleBottomSheet";
import { PRIORITY_COLORS } from "@/src/constants/priorityColors";
import { useDb } from "@/src/db/hooks";
import {
  deletePlannedPurchase,
  listPlannedPurchases,
  markAsPurchased,
  unmarkAsPurchased,
} from "@/src/features/planned-purchases/repository";
import { PlannedPurchase, Priority } from "@/src/features/planned-purchases/types";
import { useCategories } from "@/src/state/CategoriesProvider";
import { useCurrency } from "@/src/state/CurrencyProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { formatAmountFromBase } from "@/src/utils/format";
import { useResponsive } from "@/src/utils/responsive";

type FilterType = "all" | "active" | "purchased";

export default function WishlistScreen() {
  const { t } = useTranslation();
  const db = useDb();
  const { categories } = useCategories();
  const { baseCurrency } = useCurrency();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();

  const [plannedPurchases, setPlannedPurchases] = useState<PlannedPurchase[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PlannedPurchase | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPlannedPurchases = useCallback(async () => {
    try {
      const purchases = await listPlannedPurchases(db);
      setPlannedPurchases(Array.isArray(purchases) ? purchases : []);
    } catch (error) {
      console.error("Error loading planned purchases:", error);
      setPlannedPurchases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadPlannedPurchases();
    }, [loadPlannedPurchases])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlannedPurchases();
  }, [loadPlannedPurchases]);

  const handleMarkAsPurchased = useCallback(async (id: string) => {
    try {
      await markAsPurchased(id, db);
      await loadPlannedPurchases();
    } catch (error) {
      console.error("Error marking as purchased:", error);
    }
  }, [db, loadPlannedPurchases]);

  const handleUnmarkAsPurchased = useCallback(async (id: string) => {
    try {
      await unmarkAsPurchased(id, db);
      await loadPlannedPurchases();
    } catch (error) {
      console.error("Error unmarking as purchased:", error);
    }
  }, [db, loadPlannedPurchases]);

  const handleEdit = useCallback((purchase: PlannedPurchase) => {
    setSelectedPurchase(purchase);
    setShowEditForm(true);
  }, []);

  const handleUnmark = useCallback((purchase: PlannedPurchase) => {
    handleUnmarkAsPurchased(purchase.id);
  }, [handleUnmarkAsPurchased]);

  const handleDelete = useCallback(() => {
    if (selectedPurchase) {
      setDeleteModalVisible(true);
    }
  }, [selectedPurchase]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPurchase) return;

    setIsDeleting(true);
    try {
      await deletePlannedPurchase(selectedPurchase.id, db);
      await loadPlannedPurchases();
      setDeleteModalVisible(false);
      setSelectedPurchase(null);
    } catch (error) {
      console.error("Failed to delete planned purchase:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPurchase, db, loadPlannedPurchases]);

  const filteredPurchases = useMemo(() => {
    let filtered = [...plannedPurchases];

    // Apply filter
    if (filter === "active") {
      filtered = filtered.filter((p) => !p.isPurchased);
    } else if (filter === "purchased") {
      filtered = filtered.filter((p) => p.isPurchased);
    }

    // Sort: active first (by priority: high, medium, low), then purchased (by date)
    filtered.sort((a, b) => {
      if (!a.isPurchased && b.isPurchased) return -1;
      if (a.isPurchased && !b.isPurchased) return 1;

      if (!a.isPurchased && !b.isPurchased) {
        // Sort by priority
        const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Sort purchased by date (newest first)
      if (a.purchasedAt && b.purchasedAt) {
        return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
      }
      return 0;
    });

    return filtered;
  }, [plannedPurchases, filter]);

  const activeCount = useMemo(
    () => plannedPurchases.filter((p) => !p.isPurchased).length,
    [plannedPurchases]
  );
  const purchasedCount = useMemo(
    () => plannedPurchases.filter((p) => p.isPurchased).length,
    [plannedPurchases]
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
      {/* Header with Add Button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: scaleSpacing(20),
          paddingTop: scaleSpacing(20),
          paddingBottom: scaleSpacing(16),
        }}
      >
        <Text
          style={{
            color: isDark ? "#FFFFFF" : "#111827",
            fontSize: scaleFont(24),
            fontWeight: "700",
          }}
        >
          {t("wishlist.title", "Wishlist")}
        </Text>
        <Pressable
          onPress={() => setShowAddForm(true)}
          style={{
            paddingHorizontal: scaleSpacing(16),
            paddingVertical: scaleSpacing(10),
            borderRadius: scaleSpacing(8),
            backgroundColor: isDark ? "#3B82F6" : "#2563EB",
          }}
        >
          <Ionicons name="add" size={scaleSize(24)} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: scaleSpacing(20),
          marginBottom: scaleSpacing(16),
          gap: scaleSpacing(8),
        }}
      >
        {(["all", "active", "purchased"] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={{
              flex: 1,
              paddingVertical: scaleSpacing(10),
              paddingHorizontal: scaleSpacing(16),
              borderRadius: scaleSpacing(8),
              backgroundColor:
                filter === f
                  ? isDark
                    ? "#3B82F6"
                    : "#2563EB"
                  : isDark
                    ? "#374151"
                    : "#F3F4F6",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color:
                  filter === f
                    ? "#FFFFFF"
                    : isDark
                      ? "#FFFFFF"
                      : "#111827",
                fontSize: scaleFont(14),
                fontWeight: "600",
              }}
            >
              {f === "all"
                ? t("wishlist.all", "All")
                : f === "active"
                  ? `${t("wishlist.active", "Active")} (${activeCount})`
                  : `${t("wishlist.history", "History")} (${purchasedCount})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {filteredPurchases.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: scaleSpacing(60),
            paddingHorizontal: scaleSpacing(32),
          }}
        >
          <Ionicons
            name="heart-outline"
            size={scaleSize(64)}
            color={isDark ? "#6B7280" : "#9CA3AF"}
          />
          <Text
            style={{
              color: isDark ? "#9CA3AF" : "#6B7280",
              fontSize: scaleFont(18),
              fontWeight: "600",
              marginTop: scaleSpacing(16),
              textAlign: "center",
            }}
          >
            {filter === "active"
              ? t("wishlist.empty", "No planned purchases")
              : filter === "purchased"
                ? t("wishlist.empty.history", "No purchased items yet")
                : t("wishlist.empty", "No planned purchases")}
          </Text>
          <Text
            style={{
              color: isDark ? "#6B7280" : "#9CA3AF",
              fontSize: scaleFont(14),
              marginTop: scaleSpacing(8),
              textAlign: "center",
            }}
          >
            {t("wishlist.empty.subtitle", "Add items you want to buy")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPurchases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const category = categories.find((c) => c.id === item.categoryId);
            const priorityColor = PRIORITY_COLORS[item.priority];
            const isPurchased = item.isPurchased === 1;

            return (
              <Pressable
                onLongPress={() => {
                  setSelectedPurchase(item);
                  handleDelete();
                }}
                style={{
                  marginHorizontal: scaleSpacing(20),
                  marginBottom: scaleSpacing(12),
                  borderRadius: scaleSpacing(12),
                  padding: scaleSpacing(16),
                  backgroundColor: isDark ? "#374151" : "#FFFFFF",
                  borderWidth: 1.5,
                  borderColor: isPurchased
                    ? isDark
                      ? "#4B5563"
                      : "#E5E7EB"
                    : priorityColor,
                  opacity: isPurchased ? 0.7 : 1,
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
                          textDecorationLine: isPurchased ? "line-through" : "none",
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {!isPurchased && (
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
                            {t(`wishlist.priority.${item.priority}`, item.priority)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        color: isDark ? "#9CA3AF" : "#6B7280",
                        fontSize: scaleFont(14),
                        fontWeight: "600",
                      }}
                    >
                      {formatAmountFromBase(item.amountBase)} {baseCurrency?.symbol || baseCurrency?.code || ""}
                    </Text>
                    {item.note && (
                      <Text
                        style={{
                          color: isDark ? "#6B7280" : "#9CA3AF",
                          fontSize: scaleFont(12),
                          marginTop: scaleSpacing(4),
                        }}
                        numberOfLines={2}
                      >
                        {item.note}
                      </Text>
                    )}
                    {isPurchased && item.purchasedAt && (
                      <Text
                        style={{
                          color: isDark ? "#6B7280" : "#9CA3AF",
                          fontSize: scaleFont(11),
                          marginTop: scaleSpacing(4),
                          fontStyle: "italic",
                        }}
                      >
                        {t("wishlist.purchased", "Purchased")}{" "}
                        {new Date(item.purchasedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scaleSpacing(8),
                      marginLeft: scaleSpacing(12),
                    }}
                  >
                    {!isPurchased ? (
                      <>
                        <Pressable
                          onPress={() => handleEdit(item)}
                          style={{
                            padding: scaleSpacing(8),
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={scaleSize(24)}
                            color={isDark ? "#9CA3AF" : "#6B7280"}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleMarkAsPurchased(item.id)}
                          style={{
                            padding: scaleSpacing(8),
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={scaleSize(28)}
                            color={priorityColor}
                          />
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable
                          onPress={() => handleEdit(item)}
                          style={{
                            padding: scaleSpacing(8),
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={scaleSize(24)}
                            color={isDark ? "#9CA3AF" : "#6B7280"}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleUnmark(item)}
                          style={{
                            padding: scaleSpacing(8),
                          }}
                        >
                          <Ionicons
                            name="refresh-outline"
                            size={scaleSize(24)}
                            color={isDark ? "#9CA3AF" : "#6B7280"}
                          />
                        </Pressable>
                        <View
                          style={{
                            padding: scaleSpacing(8),
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={scaleSize(28)}
                            color="#10B981"
                          />
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? "#3B82F6" : "#2563EB"}
            />
          }
          contentContainerStyle={{
            paddingBottom: scaleSpacing(20),
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Form Modal */}
      <SimpleBottomSheet
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
      >
        <PlannedPurchaseForm
          onSuccess={() => {
            setShowAddForm(false);
            loadPlannedPurchases();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      </SimpleBottomSheet>

      {/* Edit Form Modal */}
      <SimpleBottomSheet
        visible={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedPurchase(null);
        }}
      >
        {selectedPurchase && (
          <PlannedPurchaseForm
            initialPurchase={selectedPurchase}
            onSuccess={() => {
              setShowEditForm(false);
              setSelectedPurchase(null);
              loadPlannedPurchases();
            }}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedPurchase(null);
            }}
          />
        )}
      </SimpleBottomSheet>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedPurchase(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={t("wishlist.delete.title", "Delete Planned Purchase")}
        message={
          selectedPurchase
            ? t("wishlist.delete.message", 'Are you sure you want to delete "{{name}}"?', {
                name: selectedPurchase.name,
              })
            : ""
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

