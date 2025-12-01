import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { UserDocument } from './firestore';

/**
 * Authentication user type
 */
export interface AuthUser {
  uid: string;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Authentication state
 */
export type AuthState = {
  user: AuthUser | null;
  userDocument: UserDocument | null;
  loading: boolean;
  error: string | null;
  userExists: boolean;
};

/**
 * Phone authentication result
 */
export interface PhoneAuthResult {
  confirmation: FirebaseAuthTypes.ConfirmationResult;
}

/**
 * Auth error types
 */
export enum AuthErrorCode {
  INVALID_PHONE_NUMBER = 'auth/invalid-phone-number',
  INVALID_VERIFICATION_CODE = 'auth/invalid-verification-code',
  CODE_EXPIRED = 'auth/code-expired',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  NETWORK_ERROR = 'auth/network-request-failed',
  UNKNOWN = 'auth/unknown',
}

/**
 * Formatted auth error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
}
