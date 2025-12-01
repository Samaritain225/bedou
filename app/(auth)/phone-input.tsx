import { PhoneInput } from '@/src/components/auth/PhoneInput';
import { useAuth } from '@/src/state/AuthProvider';
import { useTheme } from '@/src/state/ThemeProvider';
import { useResponsive } from '@/src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PhoneInputScreen() {
  const { signInWithPhone, loading, error } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { scaleSpacing, scaleFont, scaleSize } = useResponsive();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (phoneNumber.length < 8) {
      setValidationError('Please enter a valid phone number');
      return;
    }

    try {
      setValidationError(null);
      // Combine country code and phone number for auth
      // Remove leading 0 if present
      const cleanNumber = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
      const fullNumber = `${countryCode}${cleanNumber}`;
      
      const result = await signInWithPhone(fullNumber);
      
      // Navigate to OTP verification with the confirmation result and phone number
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { 
          phoneNumber: fullNumber,
          confirmation: JSON.stringify(result.confirmation)
        }
      } as any);
    } catch (err) {
      // Error is handled by AuthProvider and displayed via error state
      console.error('Phone auth error:', err);
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
            <View style={{ marginBottom: scaleSpacing(40) }}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark ? '#374151' : '#EFF6FF',
                    marginBottom: scaleSpacing(24),
                  },
                ]}
              >
                <Ionicons
                  name="call"
                  size={scaleSize(32)}
                  color={isDark ? '#60A5FA' : '#3B82F6'}
                />
              </View>
              <Text
                style={[
                  styles.title,
                  {
                    color: isDark ? '#FFFFFF' : '#111827',
                    fontSize: scaleFont(28),
                  },
                ]}
              >
                Welcome to Bedou
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: scaleFont(16),
                  },
                ]}
              >
                Enter your phone number to continue
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: scaleSpacing(24) }}>
              <PhoneInput
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setValidationError(null);
                }}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                error={validationError || error}
                disabled={loading}
              />

              <Pressable
                onPress={handleContinue}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                    opacity: pressed || loading ? 0.8 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.buttonText, { fontSize: scaleFont(16) }]}>
                    Send Code
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Footer */}
            <View style={{ marginTop: 'auto', paddingTop: scaleSpacing(24) }}>
              <Text
                style={[
                  styles.footerText,
                  {
                    color: isDark ? '#6B7280' : '#9CA3AF',
                    fontSize: scaleFont(12),
                  },
                ]}
              >
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Standard message rates may apply.
              </Text>
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
  footerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
