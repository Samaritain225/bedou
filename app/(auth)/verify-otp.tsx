import { OTPInput } from '@/src/components/auth/OTPInput';
import { useAuth } from '@/src/state/AuthProvider';
import { useTheme } from '@/src/state/ThemeProvider';
import { useResponsive } from '@/src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const confirmationJson = params.confirmation as string;
  
  const { verifyOtp, signInWithPhone, loading, error } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { scaleSpacing, scaleFont, scaleSize } = useResponsive();
  
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    if (confirmationJson) {
      try {
        setConfirmation(JSON.parse(confirmationJson));
      } catch (e) {
        console.error('Error parsing confirmation:', e);
      }
    }
  }, [confirmationJson]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleVerify = async (code: string) => {
    if (code.length !== 6 || !confirmation) return;

    try {
      await verifyOtp(confirmation, code);
      // Navigation is handled by auth state listener in _layout.tsx
    } catch (err) {
      console.error('OTP verification error:', err);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;

    try {
      const result = await signInWithPhone(phoneNumber);
      setConfirmation(result.confirmation);
      setCountdown(30);
      setOtp('');
    } catch (err) {
      console.error('Resend error:', err);
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
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark ? '#374151' : '#F3F4F6',
                  marginBottom: scaleSpacing(32),
                },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={scaleSize(24)}
                color={isDark ? '#FFFFFF' : '#111827'}
              />
            </Pressable>

            {/* Header */}
            <View style={{ marginBottom: scaleSpacing(40) }}>
              <Text
                style={[
                  styles.title,
                  {
                    color: isDark ? '#FFFFFF' : '#111827',
                    fontSize: scaleFont(28),
                  },
                ]}
              >
                Verify Phone
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
                Code sent to +221 {phoneNumber}
              </Text>
            </View>

            {/* OTP Input */}
            <View style={{ gap: scaleSpacing(32) }}>
              <OTPInput
                value={otp}
                onChange={(code) => {
                  setOtp(code);
                  if (code.length === 6) {
                    handleVerify(code);
                  }
                }}
                disabled={loading}
                error={!!error}
              />

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={isDark ? '#60A5FA' : '#3B82F6'} />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: isDark ? '#9CA3AF' : '#6B7280' },
                    ]}
                  >
                    Verifying code...
                  </Text>
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={scaleSize(20)} color="#EF4444" />
                  <Text style={[styles.errorText, { fontSize: scaleFont(14) }]}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Resend Button */}
              <View style={styles.resendContainer}>
                <Text
                  style={[
                    styles.resendText,
                    { color: isDark ? '#9CA3AF' : '#6B7280' },
                  ]}
                >
                  Didn't receive code?
                </Text>
                <Pressable
                  onPress={handleResend}
                  disabled={countdown > 0 || loading}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      {
                        color: countdown > 0
                          ? isDark ? '#4B5563' : '#9CA3AF'
                          : isDark ? '#60A5FA' : '#3B82F6',
                      },
                    ]}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </Text>
                </Pressable>
              </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
