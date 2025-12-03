import { PhoneInput } from '@/src/components/auth/PhoneInput';
import { useAuth } from '@/src/state/AuthProvider';
import { useConfirmation } from '@/src/state/ConfirmationProvider';
import { useTheme } from '@/src/state/ThemeProvider';
import { useResponsive } from '@/src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  const { setConfirmation, setPhoneNumber: setContextPhoneNumber } = useConfirmation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { scaleSpacing, scaleFont, scaleSize } = useResponsive();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = async () => {
    if (phoneNumber.length < 8) {
      setValidationError('Please enter a valid phone number');
      return;
    }

    try {
      setValidationError(null);
      const fullNumber = `${countryCode}${phoneNumber}`;
      
      console.log('📱 Attempting to sign in with:', fullNumber);
      const result = await signInWithPhone(fullNumber);
      
      // Store confirmation and phone number in context
      setConfirmation(result.confirmation);
      setContextPhoneNumber(fullNumber);
      
      // Navigate to OTP verification
      router.push('/(auth)/verify-otp');
    } catch (err) {
      // Error is handled by AuthProvider and displayed via error state
      console.error('Phone auth error:', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
      <LinearGradient
        colors={isDark 
          ? ['#0F172A', '#1E293B', '#0F172A'] 
          : ['#FFFFFF', '#F8FAFC', '#FFFFFF']
        }
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.container, 
                { 
                  padding: scaleSpacing(24),
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              {/* Decorative Elements */}
              <View style={styles.decorativeCircle1}>
                <LinearGradient
                  colors={isDark ? ['#3B82F6', '#8B5CF6'] : ['#60A5FA', '#A78BFA']}
                  style={styles.gradientCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>
              <View style={styles.decorativeCircle2}>
                <LinearGradient
                  colors={isDark ? ['#8B5CF6', '#EC4899'] : ['#A78BFA', '#F472B6']}
                  style={styles.gradientCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>

              {/* Header */}
              <View style={{ marginBottom: scaleSpacing(48), marginTop: scaleSpacing(40) }}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      marginBottom: scaleSpacing(32),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={isDark ? ['#3B82F6', '#2563EB'] : ['#60A5FA', '#3B82F6']}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={scaleSize(40)}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </View>
                <Text
                  style={[
                    styles.title,
                    {
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      fontSize: scaleFont(32),
                      marginBottom: scaleSpacing(12),
                    },
                  ]}
                >
                  Welcome to Bedou
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: isDark ? '#94A3B8' : '#64748B',
                      fontSize: scaleFont(16),
                    },
                  ]}
                >
                  Enter your phone number to get started with secure authentication
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
                  disabled={loading || phoneNumber.length < 8}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                      opacity: pressed || loading || phoneNumber.length < 8 ? 0.7 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={[styles.buttonText, { fontSize: scaleFont(17) }]}>
                        Send Code
                      </Text>
                      <Ionicons name="arrow-forward" size={scaleSize(20)} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>

                {/* Security Badge */}
                <View style={styles.securityBadge}>
                  <View style={[
                    styles.securityIcon,
                    { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }
                  ]}>
                    <Ionicons name="shield-checkmark" size={scaleSize(16)} color="#22C55E" />
                  </View>
                  <Text style={[
                    styles.securityText,
                    { 
                      color: isDark ? '#94A3B8' : '#64748B',
                      fontSize: scaleFont(13),
                    }
                  ]}>
                    Your information is encrypted and secure
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={{ marginTop: 'auto', paddingTop: scaleSpacing(40) }}>
                <Text
                  style={[
                    styles.footerText,
                    {
                      color: isDark ? '#64748B' : '#94A3B8',
                      fontSize: scaleFont(12),
                    },
                  ]}
                >
                  By continuing, you agree to our{' '}
                  <Text style={styles.footerLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.footerLink}>Privacy Policy</Text>.
                  {'\n'}Standard message rates may apply.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.1,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    lineHeight: 24,
    fontWeight: '400',
  },
  button: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  securityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
  },
  footerLink: {
    fontWeight: '600',
    color: '#3B82F6',
  },
});
