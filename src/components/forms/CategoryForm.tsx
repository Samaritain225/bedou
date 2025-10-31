import { Ionicons } from "@expo/vector-icons";
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
import { z } from "zod";
import { AVAILABLE_CATEGORY_COLORS } from "../../constants/categoryColors";
import { AVAILABLE_CATEGORY_ICONS } from "../../constants/categoryIcons";
import { CategoryType } from "../../features/categories/types";
import { useCategories } from "../../state/CategoriesProvider";
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
}

export function CategoryForm({ onClose, onSuccess }: CategoryFormProps) {
  const { t } = useTranslation();
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

      // Reset form
      setName("");
      setType("expense");
      setSelectedIcon(AVAILABLE_CATEGORY_ICONS[0]);
      setSelectedColor(AVAILABLE_CATEGORY_COLORS[0]);
      setErrors({});

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
      style={styles.container}
      className="bg-background dark:bg-background-dark flex-1"
    >
      {/* Header */}
      <View
        className="border-border dark:border-border-dark"
        style={[
          styles.header,
          {
            paddingHorizontal: scaleSpacing(20),
            paddingVertical: scaleSpacing(16),
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          style={styles.cancelButton}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Text
            style={[styles.cancelButtonText, { fontSize: scaleFont(16) }]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("common.cancel", "Cancel")}
          </Text>
        </Pressable>
        <Text
          style={[styles.headerTitle, { fontSize: scaleFont(20) }]}
          className="text-text-primary dark:text-text-primary-dark font-semibold"
        >
          {t("categories.form.title", "New Category")}
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
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.name", "Name")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderRadius: scaleSpacing(12),
                paddingHorizontal: scaleSpacing(16),
                paddingVertical: scaleSpacing(14),
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
            placeholder={t(
              "categories.form.namePlaceholder",
              "Enter category name"
            )}
            placeholderTextColor="#9CA3AF"
            maxLength={50}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Type Selector */}
        <View style={[styles.field, { marginBottom: scaleSpacing(28) }]}>
          <Text
            style={[
              styles.label,
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.type", "Type")}
          </Text>
          <View style={[styles.typeSelector, { gap: scaleSpacing(12) }]}>
            <Pressable
              className="bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
              style={[
                styles.typeButton,
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
                  { fontSize: scaleFont(15) },
                  type === "expense" && styles.typeButtonTextActive,
                ]}
              >
                {t("categories.form.expense", "Expense")}
              </Text>
            </Pressable>
            <Pressable
              className="bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
              style={[
                styles.typeButton,
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
                  { fontSize: scaleFont(15) },
                  type === "income" && styles.typeButtonTextActive,
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
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
          >
            {t("categories.form.icon", "Icon")}
          </Text>
          <FlatList
            data={AVAILABLE_CATEGORY_ICONS}
            renderItem={({ item }) => (
              <Pressable
                className="bg-surface dark:bg-surface-dark"
                style={[
                  styles.iconItem,
                  {
                    width: scaleSize(52),
                    height: scaleSize(52),
                    borderRadius: scaleSpacing(12),
                  },
                  selectedIcon === item && styles.iconItemSelected,
                ]}
                onPress={() => setSelectedIcon(item)}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}
              >
                <Ionicons
                  name={item as any}
                  size={scaleSize(26)}
                  color={selectedIcon === item ? selectedColor : "#6B7280"}
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
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
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
                  },
                  selectedColor === color && styles.colorItemSelected,
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
              { fontSize: scaleFont(16), marginBottom: scaleSpacing(8) },
            ]}
            className="text-text-primary dark:text-text-primary-dark"
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
    color: "#374151",
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
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
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
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
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
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  typeButtonTextActive: {
    color: "#ffffff",
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
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  iconItemSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#EFF6FF",
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorItemSelected: {
    borderColor: "#1F2937",
    borderWidth: 3.5,
    shadowColor: "#1F2937",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.1 }],
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
