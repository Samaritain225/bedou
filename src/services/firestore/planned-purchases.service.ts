import { COLLECTIONS } from '@/src/constants/firestore';
import { PlannedPurchaseDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Planned Purchases Service
 * Handles all planned purchase-related Firestore operations
 */
class PlannedPurchasesService extends BaseFirestoreService<PlannedPurchaseDocument> {
  constructor() {
    super(COLLECTIONS.PLANNED_PURCHASES);
  }

  /**
   * Get all planned purchases for a user
   */
  async getUserPlannedPurchases(userId: string): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(
      [['userId', '==', userId]],
      [['createdAt', 'desc']]
    );
  }

  /**
   * Get active (unpurchased) planned purchases
   */
  async getActivePlannedPurchases(userId: string): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['isPurchased', '==', false],
      ],
      [['priority', 'asc'], ['createdAt', 'desc']]
    );
  }

  /**
   * Get purchased items
   */
  async getPurchasedItems(userId: string): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['isPurchased', '==', true],
      ],
      [['purchasedAt', 'desc']]
    );
  }

  /**
   * Get planned purchases by priority
   */
  async getByPriority(
    userId: string,
    priority: 'high' | 'medium' | 'low'
  ): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['priority', '==', priority],
        ['isPurchased', '==', false],
      ],
      [['createdAt', 'desc']]
    );
  }

  /**
   * Mark as purchased
   */
  async markAsPurchased(id: string): Promise<void> {
    const timestamp = new Date();
    await this.update(id, {
      isPurchased: true,
      purchasedAt: timestamp as any,
    } as Partial<PlannedPurchaseDocument>);
  }

  /**
   * Listen to active planned purchases in real-time
   */
  onActivePurchasesSnapshot(
    userId: string,
    callback: (data: PlannedPurchaseDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [
        ['userId', '==', userId],
        ['isPurchased', '==', false],
      ],
      [['priority', 'asc'], ['createdAt', 'desc']]
    );
  }
}

export const plannedPurchasesService = new PlannedPurchasesService();
