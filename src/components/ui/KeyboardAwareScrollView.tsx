/**
 * KeyboardAwareScrollView Component
 * A ScrollView that automatically adjusts when the keyboard appears
 * to ensure input fields are never hidden
 */
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  /**
   * Additional offset for keyboard (useful for headers, tabs, etc.)
   * Default: 0
   */
  keyboardVerticalOffset?: number;
  /**
   * Whether to enable keyboard avoiding (useful for testing)
   * Default: true
   */
  enabled?: boolean;
}

export function KeyboardAwareScrollView({
  children,
  keyboardVerticalOffset = 0,
  enabled = true,
  contentContainerStyle,
  style,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps) {
  const insets = useSafeAreaInsets();
  
  // Calculate total offset including safe area
  const totalOffset = keyboardVerticalOffset + (Platform.OS === "ios" ? insets.top : 0);

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={totalOffset}
      enabled={enabled}
    >
      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={scrollViewProps.showsVerticalScrollIndicator ?? true}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

