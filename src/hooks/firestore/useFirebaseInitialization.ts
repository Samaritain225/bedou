import { initializeFirestore } from '@/src/config/firebase';
import { useEffect } from 'react';

/**
 * Firebase Initialization Hook
 * Call this in your root component to initialize Firestore
 */
export const useFirebaseInitialization = () => {
  useEffect(() => {
    const init = async () => {
      try {
        await initializeFirestore();
        console.log('✅ Firebase initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error);
      }
    };

    init();
  }, []);
};
