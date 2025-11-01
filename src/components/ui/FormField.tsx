import React from "react";
import { View, ViewProps } from "react-native";
import { useResponsive } from "../../utils/responsive";
import { ErrorText } from "./ErrorText";
import { FormLabel } from "./FormLabel";

/**
 * FormField - A wrapper component for form fields with label and error handling
 * 
 * Combines FormLabel, the input content, and ErrorText into a single reusable component.
 * Provides consistent spacing and layout for form fields.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <FormField label="Name" error={errors.name}>
 *   <TextInputField
 *     value={name}
 *     onChangeText={setName}
 *     error={!!errors.name}
 *   />
 * </FormField>
 * 
 * // With optional indicator
 * <FormField
 *   label="Note"
 *   labelOptional
 *   labelOptionalText="(Optional)"
 *   error={errors.note}
 * >
 *   <TextInputField
 *     value={note}
 *     onChangeText={setNote}
 *     multiline
 *     error={!!errors.note}
 *   />
 * </FormField>
 * 
 * // Custom content (e.g., category selector)
 * <FormField label="Category" error={errors.categoryId}>
 *   <Pressable onPress={handleSelectCategory}>
 *     <Text>{selectedCategory?.name || "Select"}</Text>
 *   </Pressable>
 * </FormField>
 * ```
 */
interface FormFieldProps extends ViewProps {
  /** The label text to display above the field */
  label: string;
  /** Whether to show an optional indicator after the label */
  labelOptional?: boolean;
  /** Custom text for the optional indicator */
  labelOptionalText?: string;
  /** Error message to display below the field (if provided) */
  error?: string;
  /** The input/field content (e.g., TextInputField, Pressable, etc.) */
  children: React.ReactNode;
  /** Custom spacing between fields (defaults to responsive 28-32px) */
  spacing?: number;
}

export function FormField({
  label,
  labelOptional = false,
  labelOptionalText,
  error,
  children,
  spacing,
  style,
  ...rest
}: FormFieldProps) {
  const { scaleSpacing, isTablet } = useResponsive();

  return (
    <View
      style={[
        {
          // Responsive spacing between form fields (larger on tablets)
          marginBottom: scaleSpacing(
            spacing ?? (isTablet ? 32 : 28)
          ),
        },
        style,
      ]}
      {...rest}
    >
      {/* Form label with optional indicator support */}
      <FormLabel optional={labelOptional} optionalText={labelOptionalText}>
        {label}
      </FormLabel>
      {/* Field content (input, selector, etc.) */}
      {children}
      {/* Error message displayed below the field if error is provided */}
      {error && <ErrorText>{error}</ErrorText>}
    </View>
  );
}

