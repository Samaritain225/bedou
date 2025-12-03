import { ConfirmationProvider } from '@/src/state/ConfirmationProvider';
import { useTheme } from '@/src/state/ThemeProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <ConfirmationProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="phone-input" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="profile-setup" />
      </Stack>
    </ConfirmationProvider>
  );
}
