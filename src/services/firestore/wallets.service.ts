import { SUBCOLLECTIONS } from '@/src/constants/firestore';
import { WalletDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Wallets Service
 * Handles all wallet-related Firestore operations
 * Uses subcollections: users/{userId}/wallets
 */
class WalletsService extends BaseFirestoreService<WalletDocument> {
  /**
   * Get all wallets
   */
  async getWallets(): Promise<WalletDocument[]> {
    return this.getAll(undefined, [['createdAt', 'desc']]);
  }

  /**
   * Get total balance across all wallets
   */
  async getTotalBalance(): Promise<number> {
    const wallets = await this.getWallets();
    return wallets.reduce((sum, wallet) => sum + wallet.amountBase, 0);
  }

  /**
   * Listen to user's wallets in real-time
   */
  onWalletsSnapshot(
    callback: (data: WalletDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      undefined,
      [['createdAt', 'desc']]
    );
  }
}

/**
 * Factory function to create a WalletsService instance for a specific user
 */
export const createWalletsService = (userId: string): WalletsService => {
  const service = new WalletsService(`users/${userId}/${SUBCOLLECTIONS.USER_WALLETS}`);
  return service;
};
