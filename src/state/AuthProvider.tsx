import { authService } from '@/src/services/auth/auth.service';
import { usersService } from '@/src/services/firestore/users.service';
import { AuthState } from '@/src/types/auth';
import { UserDocument } from '@/src/types/firestore';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType extends AuthState {
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  verifyOtp: (confirmation: any, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  createUserProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    userDocument: null,
    loading: true,
    error: null,
    userExists: false,
  });

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, check for Firestore document
        try {
          const userDoc = await usersService.getUser(user.uid);
          setState(prev => ({
            ...prev,
            user,
            userDocument: userDoc,
            userExists: !!userDoc,
            loading: false,
            error: null,
          }));
        } catch (error) {
          console.error('Error fetching user document:', error);
          setState(prev => ({
            ...prev,
            user,
            userDocument: null,
            userExists: false,
            loading: false,
            error: 'Failed to load user profile',
          }));
        }
      } else {
        // User is signed out
        setState({
          user: null,
          userDocument: null,
          loading: false,
          error: null,
          userExists: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await authService.sendVerificationCode(phoneNumber);
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const verifyOtp = async (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.verifyCode(confirmation, code);
      // State update will happen in onAuthStateChanged
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const createUserProfile = async (name: string) => {
    const { user } = state;
    if (!user) throw new Error('No authenticated user');

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Update auth profile
      await authService.updateProfile({ displayName: name });
      
      // Create Firestore document
      const userData: Partial<UserDocument> = {
        phoneNumber: user.phoneNumber || '',
        displayName: name,
        baseCurrency: 'XOF', // Default currency
        photoURL: user.photoURL || null,
      };
      
      await usersService.createOrUpdateUser(user.uid, userData);
      
      // Fetch the new document to update state
      const userDoc = await usersService.getUser(user.uid);
      
      setState(prev => ({
        ...prev,
        userDocument: userDoc,
        userExists: !!userDoc,
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithPhone,
        verifyOtp,
        signOut,
        createUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
