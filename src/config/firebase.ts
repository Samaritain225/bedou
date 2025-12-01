import firestore from '@react-native-firebase/firestore';

/**
 * Initialize Firestore with offline persistence
 */
export const initializeFirestore = async (): Promise<void> => {
  try {
    // Enable offline persistence with unlimited cache
    await firestore().settings({
      persistence: true,
      cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    });

    console.log('✅ Firestore initialized with offline persistence');
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    throw error;
  }
};

/**
 * Get Firestore instance
 */
export const getFirestore = () => firestore();

/**
 * Enable Firestore logging (for development)
 */
export const enableFirestoreLogging = (enable: boolean = true): void => {
  if (__DEV__) {
    firestore().settings({
      ignoreUndefinedProperties: true,
    });
  }
};
