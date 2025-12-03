import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CategoryForm } from "../../src/components/forms/CategoryForm";
import { Card } from "../../src/components/ui/Card";
import { DeleteModal } from "../../src/components/ui/DeleteModal";
import { SimpleBottomSheet } from "../../src/components/ui/SimpleBottomSheet";
import { Category } from "../../src/features/categories/types";
import { useCategories } from "../../src/state/CategoriesProvider";
import { useResponsive } from "../../src/utils/responsive";

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const { categories, deleteCategory, refresh } = useCategories();
  const params = useLocalSearchParams<{ openAdd?: string }>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const { width, scaleSpacing, getColumns, scaleSize, scaleFont } =
    useResponsive();

  // Open bottom sheet if openAdd param is present
  useFocusEffect(
    useCallback(() => {
      if (params.openAdd === "true") {
        // Small delay to ensure screen is fully mounted
        setTimeout(() => {
          setShowBottomSheet(true);
          setEditingCategory(null);
        }, 100);
      }
    }, [params.openAdd])
  );

  // Responsive grid calculations
  const numColumns = useMemo(() => getColumns(3), [getColumns]);
  const screenPadding = useMemo(() => scaleSpacing(16), [scaleSpacing]);
  const itemSpacing = useMemo(() => scaleSpacing(12), [scaleSpacing]);
  const itemWidth = useMemo(() => {
    return (
      (width - screenPadding * 2 - itemSpacing * (numColumns - 1)) / numColumns
    );
  }, [width, screenPadding, itemSpacing, numColumns]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    
    setDeletingId(categoryToDelete.id);
    try {
      await deleteCategory(categoryToDelete.id);
      setDeleteModalVisible(false);
      setCategoryToDelete(null);
    } catch (error) {
      // Error handling could show an inline error message
      console.error("Failed to delete category:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowBottomSheet(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setShowBottomSheet(true);
  };

  const handleBottomSheetClose = () => {
    setShowBottomSheet(false);
    setEditingCategory(null);
  };

  const handleCategorySaved = () => {
    // Category was saved successfully, bottom sheet will close automatically
    // We could refresh the list here if needed
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const isDeleting = deletingId === item.id;

    return (
      <Pressable
        style={[
          styles.categoryCard,
          {
            width: itemWidth,
            marginHorizontal: itemSpacing / 2,
          },
        ]}
        onPress={() => handleEdit(item)}
        onLongPress={() => handleDelete(item)}
        disabled={isDeleting}
      >
        <Card
          className="items-center justify-center p-3"
          style={[styles.cardContent, isDeleting && styles.deletingCard]}
        >
          <View
            style={[
              styles.coloredContainer,
              { backgroundColor: item.color + "20" },
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={scaleSize(36)}
              color={item.color}
            />
            <Text
              style={[
                styles.categoryName,
                { color: item.color, fontSize: scaleFont(14) },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
          </View>
          {isDeleting && (
            <View style={styles.deletingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </Card>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pricetags-outline" size={64} color="#999" />
      <Text className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mt-4">
        {t("categories.empty") || "No categories yet"}
      </Text>
      <Text className="text-sm text-text-secondary dark:text-text-secondary-dark mt-2 text-center px-8">
        {t("categories.empty.subtitle") ||
          "Tap the + button to add your first category"}
      </Text>
    </View>
  );

  return (
    <View
      style={styles.container}
      className="bg-background dark:bg-background-dark"
    >
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          { padding: screenPadding, paddingBottom: scaleSpacing(80) },
        ]}
        columnWrapperStyle={[styles.row, { marginBottom: itemSpacing }]}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      />
      <Pressable
        style={[
          styles.fab,
          {
            width: scaleSize(56),
            height: scaleSize(56),
            borderRadius: scaleSize(28),
            right: scaleSpacing(20),
            bottom: scaleSpacing(20),
          },
        ]}
        onPress={handleAdd}
      >
        <Ionicons name="add" size={scaleSize(28)} color="#fff" />
      </Pressable>

      <SimpleBottomSheet
        visible={showBottomSheet}
        onClose={handleBottomSheetClose}
      >
        <CategoryForm
          onClose={handleBottomSheetClose}
          onSuccess={handleCategorySaved}
          initialCategory={editingCategory || undefined}
        />
      </SimpleBottomSheet>

      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t("categories.delete.title", "Delete Category")}
        message={
          categoryToDelete
            ? t("categories.delete.message", { name: categoryToDelete.name }) ||
              `Are you sure you want to delete "${categoryToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel={t("common.delete", "Delete")}
        isLoading={deletingId !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    // Dynamic padding applied inline
  },
  row: {
    justifyContent: "center",
  },
  categoryCard: {
    // Dynamic width applied inline
    marginHorizontal: 6, // Base value, will be scaled
  },
  cardContent: {
    minHeight: 120, // Will be scaled responsively
    aspectRatio: 1,
  },
  deletingCard: {
    opacity: 0.5,
  },
  coloredContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  deletingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  fab: {
    position: "absolute",
    // Dynamic sizes applied inline
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
