import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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
import { z } from "zod";
import { AVAILABLE_CATEGORY_COLORS } from "../../constants/categoryColors";
import { AVAILABLE_CATEGORY_ICONS } from "../../constants/categoryIcons";
import { Category, CategoryType } from "../../features/categories/types";
import { useCategories } from "../../state/CategoriesProvider";
import { useTheme } from "../../state/ThemeProvider";
import { useResponsive } from "../../utils/responsive";
import { Card } from "../ui/Card";

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

interface CategoryFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialCategory?: Category;
}

export function CategoryForm({
  onClose,
  onSuccess,
  initialCategory,
}: CategoryFormProps) {
  const { t } = useTranslation();
  const { addCategory, updateCategory } = useCategories();
  const { scaleSpacing, scaleSize, scaleFont, getColumns } = useResponsive();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const nameInputRef = useRef<TextInput>(null);
  const isEditing = !!initialCategory;

  const [name, setName] = useState(initialCategory?.name || "");
  const [type, setType] = useState<CategoryType>(
    initialCategory?.type || "expense"
  );
  const [selectedIcon, setSelectedIcon] = useState<string>(
    initialCategory?.icon || AVAILABLE_CATEGORY_ICONS[0]
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    initialCategory?.color || AVAILABLE_CATEGORY_COLORS[0]
  );
  const [errors, setErrors] = useState<{
    name?: string;
    type?: string;
    icon?: string;
    color?: string;
  }>({});

  // Update form when initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setType(initialCategory.type);
      setSelectedIcon(initialCategory.icon);
      setSelectedColor(initialCategory.color);
      setErrors({});
      // Focus name input after a short delay when in edit mode
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    }
  }, [initialCategory]);

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

      if (isEditing && initialCategory) {
        // Update existing category
        await updateCategory({
          id: initialCategory.id,
          name: result.data.name,
          type: result.data.type,
          icon: result.data.icon,
          color: result.data.color,
        });
      } else {
        // Create new category
        await addCategory({
          name: result.data.name,
          type: result.data.type,
          icon: result.data.icon,
          color: result.data.color,
        });
      }

      // Reset form only if creating new
      if (!isEditing) {
        setName("");
        setType("expense");
        setSelectedIcon(AVAILABLE_CATEGORY_ICONS[0]);
        setSelectedColor(AVAILABLE_CATEGORY_COLORS[0]);
        setErrors({});
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("categories.form.saveError") ||
          "Failed to save category. Please try again."
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: scaleSpacing(20),
            paddingVertical: scaleSpacing(16),
            borderBottomColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          style={styles.cancelButton}
          android_ripple={{ color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
        >
          <Text
            style={[
              styles.cancelButtonText,
              { fontSize: scaleFont(16), color: isDark ? "#E5E7EB" : "#374151" },
            ]}
          >
            {t("common.cancel", "Cancel")}
          </Text>
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { fontSize: scaleFont(20), color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          {isEditing
            ? t("categories.form.editTitle", "Edit Category")
            : t("categories.form.title", "New Category")}
        </Text>
        <Pressable
          onPress={handleSave}
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
          disabled={!name.trim()}
          android_ripple={{ color: "rgba(37, 99, 235, 0.2)" }}
        >
          <Text
            style={[
              styles.saveButtonText,
              { fontSize: scaleFont(16) },
              !name.trim() && styles.saveButtonTextDisabled,
            ]}
          >
            {t("common.save", "Save")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          {
            padding: scaleSpacing(20),
            paddingBottom: scaleSpacing(20),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Field */}
        <View style={[styles.field, { marginBottom: scaleSpacing(28) }]}>
          <Text
            style={[
              styles.label,
              {
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
              },
            ]}
          >
            {t("categories.form.name", "Name")}
          </Text>
          <TextInput
            ref={nameInputRef}
            style={[
              styles.input,
              {
                borderRadius: scaleSpacing(12),
                paddingHorizontal: scaleSpacing(16),
                paddingVertical: scaleSpacing(14),
                fontSize: scaleFont(16),
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderColor: isDark ? "#4B5563" : "#E5E7EB",
                color: isDark ? "#FFFFFF" : "#111827",
              },
              errors.name && {
                borderColor: "#EF4444",
                borderWidth: 1.5,
              },
            ]}
            placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
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
            placeholder={t(
              "categories.form.namePlaceholder",
              "Enter category name"
            )}
            maxLength={50}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Type Selector */}
        <View style={[styles.field, { marginBottom: scaleSpacing(28) }]}>
          <Text
            style={[
              styles.label,
              {
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
              },
            ]}
          >
            {t("categories.form.type", "Type")}
          </Text>
          <View style={[styles.typeSelector, { gap: scaleSpacing(12) }]}>
            <Pressable
              style={[
                styles.typeButton,
                {
                  backgroundColor: isDark ? "#374151" : "#F9FAFB",
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                },
                type === "expense" && styles.typeButtonActive,
              ]}
              onPress={() => setType("expense")}
              android_ripple={{
                color:
                  type === "expense"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(37, 99, 235, 0.1)",
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    fontSize: scaleFont(15),
                    color:
                      type === "expense"
                        ? "#FFFFFF"
                        : isDark
                          ? "#D1D5DB"
                          : "#6B7280",
                  },
                ]}
              >
                {t("categories.form.expense", "Expense")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                {
                  backgroundColor: isDark ? "#374151" : "#F9FAFB",
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                },
                type === "income" && styles.typeButtonActive,
              ]}
              onPress={() => setType("income")}
              android_ripple={{
                color:
                  type === "income"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(37, 99, 235, 0.1)",
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    fontSize: scaleFont(15),
                    color:
                      type === "income"
                        ? "#FFFFFF"
                        : isDark
                          ? "#D1D5DB"
                          : "#6B7280",
                  },
                ]}
              >
                {t("categories.form.income", "Income")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Icon Picker */}
        <View style={[styles.field, { marginBottom: scaleSpacing(28) }]}>
          <Text
            style={[
              styles.label,
              {
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
              },
            ]}
          >
            {t("categories.form.icon", "Icon")}
          </Text>
          <FlatList
            data={AVAILABLE_CATEGORY_ICONS}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.iconItem,
                  {
                    width: scaleSize(52),
                    height: scaleSize(52),
                    borderRadius: scaleSpacing(12),
                    backgroundColor: isDark ? "#374151" : "#F9FAFB",
                    borderColor:
                      selectedIcon === item
                        ? "#2563eb"
                        : isDark
                          ? "#4B5563"
                          : "#E5E7EB",
                  },
                  selectedIcon === item && {
                    backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF",
                  },
                ]}
                onPress={() => setSelectedIcon(item)}
                android_ripple={{
                  color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                }}
              >
                <Ionicons
                  name={item as any}
                  size={scaleSize(26)}
                  color={
                    selectedIcon === item
                      ? selectedColor
                      : isDark
                        ? "#9CA3AF"
                        : "#6B7280"
                  }
                />
              </Pressable>
            )}
            keyExtractor={(item) => item}
            numColumns={5}
            scrollEnabled={false}
            contentContainerStyle={[
              styles.iconGrid,
              { gap: scaleSpacing(12), justifyContent: "center" },
            ]}
            columnWrapperStyle={{ gap: scaleSpacing(12) }}
          />
        </View>

        {/* Color Picker */}
        <View style={[styles.field, { marginBottom: scaleSpacing(28) }]}>
          <Text
            style={[
              styles.label,
              {
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
              },
            ]}
          >
            {t("categories.form.color", "Color")}
          </Text>
          <View style={[styles.colorGrid, { gap: scaleSpacing(14) }]}>
            {AVAILABLE_CATEGORY_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorItem,
                  {
                    backgroundColor: color,
                    width: scaleSize(52),
                    height: scaleSize(52),
                    borderRadius: scaleSize(26),
                    borderColor:
                      selectedColor === color
                        ? isDark
                          ? "#FFFFFF"
                          : "#1F2937"
                        : "transparent",
                  },
                  selectedColor === color && {
                    borderWidth: isDark ? 4 : 3.5,
                    transform: [{ scale: 1.1 }],
                  },
                ]}
                onPress={() => setSelectedColor(color)}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}
              >
                {selectedColor === color && (
                  <Ionicons
                    name="checkmark"
                    size={scaleSize(22)}
                    color="#fff"
                    style={styles.colorCheckmark}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={[styles.field, { marginBottom: scaleSpacing(20) }]}>
          <Text
            style={[
              styles.label,
              {
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(8),
                color: isDark ? "#F3F4F6" : "#111827",
              },
            ]}
          >
            {t("categories.form.preview", "Preview")}
          </Text>
          <View style={styles.previewWrapper}>
            <Card
              className="items-center justify-center p-4"
              style={[
                styles.previewCard,
                {
                  width: scaleSize(140),
                  height: scaleSize(140),
                },
              ]}
            >
              <View
                style={[
                  styles.previewContainer,
                  {
                    backgroundColor: selectedColor + "15",
                    borderRadius: scaleSpacing(16),
                    paddingVertical: scaleSpacing(20),
                    paddingHorizontal: scaleSpacing(12),
                    borderWidth: 2,
                    borderColor: selectedColor + "40",
                  },
                ]}
              >
                <Ionicons
                  name={selectedIcon as any}
                  size={scaleSize(40)}
                  color={selectedColor}
                />
                <Text
                  style={[
                    styles.previewText,
                    {
                      color: selectedColor,
                      fontSize: scaleFont(15),
                      marginTop: scaleSpacing(12),
                    },
                  ]}
                  numberOfLines={2}
                >
                  {name.trim() ||
                    t("categories.form.previewPlaceholder", "Category Name")}
                </Text>
              </View>
            </Card>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  cancelButtonText: {
    fontWeight: "500",
  },
  headerTitle: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "transparent",
    opacity: 1,
  },
  saveButtonText: {
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.2,
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
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  typeButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonText: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  iconGrid: {
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconItem: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  colorItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorCheckmark: {
    fontWeight: "bold",
  },
  previewWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  previewCard: {
    width: 140,
    height: 140,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  previewText: {
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
