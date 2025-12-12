import { ThemeColors } from '@/src/constants/themeColors';
import { useAuth } from '@/src/state/AuthProvider';
import { useTheme } from '@/src/state/ThemeProvider';
import { useResponsive } from '@/src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileSetupScreen() {
  const { createUserProfile, loading, error } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { scaleSpacing, scaleFont, scaleSize } = useResponsive();
  
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      setValidationError('Please enter a valid name (at least 2 characters)');
      return;
    }

    try {
      setValidationError(null);
      await createUserProfile(name.trim());
      // Navigation is handled by auth state listener in _layout.tsx
    } catch (err) {
      console.error('Profile creation error:', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, { padding: scaleSpacing(24) }]}>
            {/* Header */}
            <View style={{ marginBottom: scaleSpacing(40), alignItems: 'center' }}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark ? ThemeColors.dark.surfaceSecondary : ThemeColors.light.successLight + '20',
                    marginBottom: scaleSpacing(24),
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={scaleSize(32)}
                  color={isDark ? ThemeColors.dark.success : ThemeColors.light.success}
                />
              </View>
              <Text
                style={[
                  styles.title,
                  {
                    color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                    fontSize: scaleFont(28),
                    textAlign: 'center',
                  },
                ]}
              >
                What's your name?
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary,
                    fontSize: scaleFont(16),
                    textAlign: 'center',
                  },
                ]}
              >
                Let us know how to address you
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: scaleSpacing(24), alignItems: 'center', width: '100%' }}>
              <View style={{ width: '100%', maxWidth: 400 }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? ThemeColors.dark.surface : ThemeColors.light.surfaceSecondary,
                      borderColor: validationError
                        ? ThemeColors.light.error
                        : isDark ? ThemeColors.dark.border : ThemeColors.light.border,
                      color: isDark ? ThemeColors.dark.text : ThemeColors.light.text,
                    },
                  ]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setValidationError(null);
                  }}
                  placeholder="Your Name"
                  placeholderTextColor={isDark ? ThemeColors.dark.textSecondary : ThemeColors.light.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
                {validationError && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={scaleSize(14)} color="#EF4444" />
                    <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                      {validationError}
                    </Text>
                  </View>
                )}
              </View>

              {error && (
                <View style={[styles.apiErrorContainer, { width: '100%', maxWidth: 400 }]}>
                  <Ionicons name="alert-circle" size={scaleSize(20)} color="#EF4444" />
                  <Text style={[styles.apiErrorText, { fontSize: scaleFont(14) }]}>
                    {error}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleContinue}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: isDark ? ThemeColors.dark.primary : ThemeColors.light.primary,
                    opacity: pressed || loading ? 0.8 : 1,
                    width: '100%',
                    maxWidth: 400,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.buttonText, { fontSize: scaleFont(16) }]}>
                    Continue
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    color: '#EF4444',
  },
  apiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
  },
  apiErrorText: {
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
