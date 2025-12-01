import { AuthError, AuthErrorCode, AuthUser, PhoneAuthResult } from '@/src/types/auth';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Phone Authentication Service
 * Handles all Firebase phone authentication operations
 */
class AuthService {
  /**
   * Format phone number to E.164 format
   * Example: 761234567 -> +221761234567
   */
  formatPhoneNumber(phoneNumber: string, countryCode: string = '+225'): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If it already starts with country code, return as is
    if (cleaned.startsWith(countryCode.replace('+', ''))) {
      return `+${cleaned}`;
    }

    // Add country code
    return `${countryCode}${cleaned}`;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's a valid length (9 digits for Senegal)
    return cleaned.length >= 9 && cleaned.length <= 15;
  }

  /**
   * Send OTP verification code to phone number
   */
  async sendVerificationCode(phoneNumber: string): Promise<PhoneAuthResult> {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      if (!this.validatePhoneNumber(formattedNumber)) {
        throw this.createError(AuthErrorCode.INVALID_PHONE_NUMBER, 'Invalid phone number format');
      }

      console.log('📱 Sending verification code to:', formattedNumber);

      const confirmation = await auth().signInWithPhoneNumber(formattedNumber);

      console.log('✅ Verification code sent successfully');

      return { confirmation };
    } catch (error: any) {
      console.error('❌ Error sending verification code:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify OTP code
   */
  async verifyCode(
    confirmation: FirebaseAuthTypes.ConfirmationResult,
    code: string
  ): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      console.log('🔐 Verifying OTP code...');

      const userCredential = await confirmation.confirm(code);

      if (!userCredential) {
        throw this.createError(AuthErrorCode.INVALID_VERIFICATION_CODE, 'Failed to verify code');
      }

      console.log('✅ OTP verified successfully');

      return userCredential;
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    const firebaseUser = auth().currentUser;

    if (!firebaseUser) {
      return null;
    }

    return this.mapFirebaseUser(firebaseUser);
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('👋 Signing out user...');
      await auth().signOut();
      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('❌ Error signing out:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(
    callback: (user: AuthUser | null) => void
  ): () => void {
    return auth().onAuthStateChanged((firebaseUser) => {
      const user = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
      callback(user);
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    try {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw this.createError(AuthErrorCode.UNKNOWN, 'No user is currently signed in');
      }

      await currentUser.updateProfile(updates);
      console.log('✅ User profile updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Map Firebase user to AuthUser
   */
  private mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User): AuthUser {
    return {
      uid: firebaseUser.uid,
      phoneNumber: firebaseUser.phoneNumber,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
  }

  /**
   * Handle Firebase auth errors
   */
  private handleAuthError(error: any): AuthError {
    const code = error.code as string;

    switch (code) {
      case 'auth/invalid-phone-number':
        return this.createError(
          AuthErrorCode.INVALID_PHONE_NUMBER,
          'The phone number format is invalid. Please enter a valid phone number.'
        );
      case 'auth/invalid-verification-code':
        return this.createError(
          AuthErrorCode.INVALID_VERIFICATION_CODE,
          'The verification code is invalid. Please check and try again.'
        );
      case 'auth/code-expired':
        return this.createError(
          AuthErrorCode.CODE_EXPIRED,
          'The verification code has expired. Please request a new code.'
        );
      case 'auth/too-many-requests':
        return this.createError(
          AuthErrorCode.TOO_MANY_REQUESTS,
          'Too many requests. Please try again later.'
        );
      case 'auth/network-request-failed':
        return this.createError(
          AuthErrorCode.NETWORK_ERROR,
          'Network error. Please check your connection and try again.'
        );
      default:
        return this.createError(
          AuthErrorCode.UNKNOWN,
          error.message || 'An unexpected error occurred. Please try again.'
        );
    }
  }

  /**
   * Create auth error object
   */
  private createError(code: AuthErrorCode, message: string): AuthError {
    return { code, message };
  }
}

export const authService = new AuthService();
