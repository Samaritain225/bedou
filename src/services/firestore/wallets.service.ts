import { COLLECTIONS } from '@/src/constants/firestore';
import { WalletDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Wallets Service
 * Handles all wallet-related Firestore operations
 */
class WalletsService extends BaseFirestoreService<WalletDocument> {
  constructor() {
    super(COLLECTIONS.WALLETS);
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<WalletDocument[]> {
    return this.getAll(
      [['userId', '==', userId]],
      [['createdAt', 'desc']]
    );
  }

  /**
   * Get wallet by name
   */
  async getWalletByName(userId: string, name: string): Promise<WalletDocument | null> {
    const wallets = await this.getAll([
      ['userId', '==', userId],
      ['name', '==', name],
    ]);
    return wallets.length > 0 ? wallets[0] : null;
  }

  /**
   * Get total balance across all wallets
   */
  async getTotalBalance(userId: string): Promise<number> {
    const wallets = await this.getUserWallets(userId);
    return wallets.reduce((sum, wallet) => sum + wallet.amountBase, 0);
  }

  /**
   * Listen to user's wallets in real-time
   */
  onUserWalletsSnapshot(
    userId: string,
    callback: (data: WalletDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [['userId', '==', userId]],
      [['createdAt', 'desc']]
    );
  }
}

export const walletsService = new WalletsService();
