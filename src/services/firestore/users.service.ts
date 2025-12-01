import { COLLECTIONS } from '@/src/constants/firestore';
import { UserDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Users Service
 * Handles all user-related Firestore operations
 */
class UsersService extends BaseFirestoreService<UserDocument> {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  /**
   * Create or update user document
   * Uses the Auth UID as the document ID
   */
  async createOrUpdateUser(
    uid: string,
    userData: Partial<UserDocument>
  ): Promise<void> {
    const exists = await this.userExists(uid);

    if (exists) {
      await this.update(uid, userData);
    } else {
      // For new users, ensure required fields are present
      await this.createWithId(uid, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as UserDocument);
    }
  }

  /**
   * Check if user profile exists
   */
  async userExists(uid: string): Promise<boolean> {
    const user = await this.getById(uid);
    return !!user;
  }

  /**
   * Get user profile
   */
  async getUser(uid: string): Promise<UserDocument | null> {
    return this.getById(uid);
  }

  /**
   * Listen to user document changes
   */
  onUserSnapshot(
    uid: string,
    callback: (user: UserDocument | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onDocumentSnapshot(uid, callback, onError);
  }
}

export const usersService = new UsersService();
