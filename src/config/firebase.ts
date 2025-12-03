import { getFirestore } from '@react-native-firebase/firestore';

/**
 * Initialize Firestore with offline persistence
 * Note: React Native Firebase enables offline persistence by default
 */
export const initializeFirestore = async (): Promise<void> => {
  try {
    // Get Firestore instance - persistence is enabled by default in React Native Firebase
    getFirestore();
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    throw error;
  }
};

/**
 * Get Firestore instance
 */
export { getFirestore };

/**
 * Enable Firestore logging (for development)
 */
export const enableFirestoreLogging = (enable: boolean = true): void => {
  if (__DEV__) {
    // Note: ignoreUndefinedProperties is handled automatically in modular API
    // No equivalent setting needed
  }
};
