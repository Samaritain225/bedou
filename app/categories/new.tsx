import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { Card } from "../../src/components/ui/Card";
import { AVAILABLE_CATEGORY_COLORS } from "../../src/constants/categoryColors";
import { AVAILABLE_CATEGORY_ICONS } from "../../src/constants/categoryIcons";
import { CategoryType } from "../../src/features/categories/types";
import { useCategories } from "../../src/state/CategoriesProvider";
import { useResponsive } from "../../src/utils/responsive";

const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .trim(),
  type: z.enum(["expense", "income"]),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
});

export default function NewCategoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { addCategory } = useCategories();
  const { scaleSpacing, scaleSize, scaleFont, getColumns } = useResponsive();

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [selectedIcon, setSelectedIcon] = useState<string>(
    AVAILABLE_CATEGORY_ICONS[0]
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    AVAILABLE_CATEGORY_COLORS[0]
  );
  const [errors, setErrors] = useState<{
    name?: string;
    type?: string;
    icon?: string;
    color?: string;
  }>({});

  const handleSave = async () => {
    try {
      const result = categorySchema.safeParse({
        name,
        type,
        icon: selectedIcon,
        color: selectedColor,
      });

      if (!result.success) {
        const newErrors: typeof errors = {};
        for (const err of result.error.errors) {
          const field = err.path[0] as keyof typeof errors;
          if (field) {
            newErrors[field] = err.message;
          }
        }
        setErrors(newErrors);
        return;
      }

      setErrors({});

      await addCategory({
        name: result.data.name,
        type: result.data.type,
        icon: result.data.icon,
        color: result.data.color,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("categories.form.saveError") ||
          "Failed to save category. Please try again."
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View
      className="flex-1 bg-background dark:bg-background-dark"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      {/* Header */}
      <View
        className="border-border dark:border-border-dark"
        style={[
          styles.header,
          {
            paddingHorizontal: scaleSpacing(16),
            paddingVertical: scaleSpacing(12),
          },
        ]}
      >
        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <Text className="text-text-primary dark:text-text-primary-dark">
            {t("common.cancel") || "Cancel"}
          </Text>
        </Pressable>
        <Text
          style={[styles.headerTitle, { fontSize: scaleFont(18) }]}
          className="text-text-primary dark:text-text-primary-dark"
        >
          {t("categories.form.title") || "New Category"}
        </Text>
        <Pressable
          onPress={handleSave}
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
          disabled={!name.trim()}
        >
          <Text
            style={[
              styles.saveButtonText,
              !name.trim() && styles.saveButtonTextDisabled,
            ]}
          >
            {t("common.save") || "Save"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          {
            padding: scaleSpacing(16),
            paddingBottom: scaleSpacing(32),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Field */}
        <View style={[styles.field, { marginBottom: scaleSpacing(24) }]}>
          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.name") || "Name"}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderRadius: scaleSpacing(8),
                paddingHorizontal: scaleSpacing(12),
                paddingVertical: scaleSpacing(12),
                fontSize: scaleFont(16),
              },
              errors.name && styles.inputError,
            ]}
            className="bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
            onBlur={() => {
              const result = categorySchema.safeParse({
                name,
                type,
                icon: selectedIcon,
                color: selectedColor,
              });
              if (!result.success) {
                const nameError = result.error.errors.find(
                  (e) => e.path[0] === "name"
                );
                if (nameError) {
                  setErrors({ ...errors, name: nameError.message });
                } else if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              } else if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
            placeholder={
              t("categories.form.namePlaceholder") || "Enter category name"
            }
            placeholderTextColor="#999"
            maxLength={50}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Type Selector */}
        <View style={[styles.field, { marginBottom: scaleSpacing(24) }]}>
          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.type") || "Type"}
          </Text>
          <View style={styles.typeSelector}>
            <Pressable
              className="bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
              style={[
                styles.typeButton,
                type === "expense" && styles.typeButtonActive,
              ]}
              onPress={() => setType("expense")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === "expense" && styles.typeButtonTextActive,
                ]}
              >
                {t("categories.form.expense") || "Expense"}
              </Text>
            </Pressable>
            <Pressable
              className="bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
              style={[
                styles.typeButton,
                type === "income" && styles.typeButtonActive,
              ]}
              onPress={() => setType("income")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === "income" && styles.typeButtonTextActive,
                ]}
              >
                {t("categories.form.income") || "Income"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Icon Picker */}
        <View style={[styles.field, { marginBottom: scaleSpacing(24) }]}>
          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.icon") || "Icon"}
          </Text>
          <FlatList
            data={AVAILABLE_CATEGORY_ICONS}
            renderItem={({ item }) => (
              <Pressable
                className="bg-surface dark:bg-surface-dark"
                style={[
                  styles.iconItem,
                  {
                    width: scaleSize(48),
                    height: scaleSize(48),
                    borderRadius: scaleSpacing(8),
                  },
                  selectedIcon === item && styles.iconItemSelected,
                ]}
                onPress={() => setSelectedIcon(item)}
              >
                <Ionicons
                  name={item as any}
                  size={scaleSize(28)}
                  color={selectedIcon === item ? selectedColor : "#666"}
                />
              </Pressable>
            )}
            keyExtractor={(item) => item}
            numColumns={getColumns(6)}
            scrollEnabled={false}
            contentContainerStyle={[styles.iconGrid, { gap: scaleSpacing(8) }]}
          />
        </View>

        {/* Color Picker */}
        <View style={[styles.field, { marginBottom: scaleSpacing(24) }]}>
          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.color") || "Color"}
          </Text>
          <View style={[styles.colorGrid, { gap: scaleSpacing(12) }]}>
            {AVAILABLE_CATEGORY_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorItem,
                  {
                    backgroundColor: color,
                    width: scaleSize(48),
                    height: scaleSize(48),
                    borderRadius: scaleSize(24),
                  },
                  selectedColor === color && styles.colorItemSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons
                    name="checkmark"
                    size={scaleSize(20)}
                    color="#fff"
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={[styles.field, { marginBottom: scaleSpacing(24) }]}>
          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.preview") || "Preview"}
          </Text>
          <Card
            className="items-center justify-center p-4"
            style={[
              styles.previewCard,
              {
                width: scaleSize(120),
                height: scaleSize(120),
              },
            ]}
          >
            <View
              style={[
                styles.previewContainer,
                {
                  backgroundColor: selectedColor + "20",
                  borderRadius: scaleSpacing(12),
                  paddingVertical: scaleSpacing(16),
                  paddingHorizontal: scaleSpacing(8),
                },
              ]}
            >
              <Ionicons
                name={selectedIcon as any}
                size={scaleSize(36)}
                color={selectedColor}
              />
              <Text
                style={[
                  styles.previewText,
                  {
                    color: selectedColor,
                    fontSize: scaleFont(14),
                    marginTop: scaleSpacing(10),
                  },
                ]}
                numberOfLines={2}
              >
                {name.trim() ||
                  t("categories.form.previewPlaceholder") ||
                  "Category Name"}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
  saveButtonTextDisabled: {
    color: "#9ca3af",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    // Padding applied inline responsively
  },
  field: {
    // marginBottom applied inline responsively
  },
  label: {
    // fontSize and marginBottom applied inline responsively
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    // Sizes applied inline responsively
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  iconGrid: {
    gap: 8,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconItemSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorItemSelected: {
    borderColor: "#000",
    borderWidth: 3,
  },
  previewCard: {
    width: 120,
    height: 120,
    alignSelf: "center",
  },
  previewContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
});
