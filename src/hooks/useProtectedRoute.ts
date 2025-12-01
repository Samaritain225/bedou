import { useAuth } from '@/src/state/AuthProvider';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hook to protect routes based on authentication state
 * Follows Expo Router official authentication pattern
 */
export function useProtectedRoute() {
  const { user, loading, userExists } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if we are in the profile setup screen specifically
    // We cast to string to avoid TS errors with strict segment types
    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inProfileSetup = inAuthGroup && (segments[1] as string) === 'profile-setup';

    if (!user && !inAuthGroup) {
      // If user is not signed in and not in auth group, redirect to phone input
      router.replace('/(auth)/phone-input' as any);
    } else if (user && !userExists && !inProfileSetup) {
      // If user is signed in but has no profile (and not already setting it up),
      // redirect to profile setup
      router.replace('/(auth)/profile-setup' as any);
    } else if (user && userExists && inAuthGroup) {
      // If user is signed in and has profile, and is in auth group,
      // redirect to main app (tabs)
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, userExists, segments]);
}
