import { SUBCOLLECTIONS } from '@/src/constants/firestore';
import { PlannedPurchaseDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Planned Purchases Service
 * Handles all planned purchase-related Firestore operations
 * Uses subcollections: users/{userId}/plannedPurchases
 */
class PlannedPurchasesService extends BaseFirestoreService<PlannedPurchaseDocument> {
  /**
   * Get all planned purchases
   */
  async getPlannedPurchases(): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(undefined, [['createdAt', 'desc']]);
  }

  /**
   * Get active (unpurchased) planned purchases
   */
  async getActivePlannedPurchases(): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(
      [['isPurchased', '==', false]],
      [['priority', 'asc'], ['createdAt', 'desc']]
    );
  }

  /**
   * Get purchased items
   */
  async getPurchasedItems(): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(
      [['isPurchased', '==', true]],
      [['purchasedAt', 'desc']]
    );
  }

  /**
   * Get planned purchases by priority
   */
  async getByPriority(priority: 'high' | 'medium' | 'low'): Promise<PlannedPurchaseDocument[]> {
    return this.getAll(
      [
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
    callback: (data: PlannedPurchaseDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [['isPurchased', '==', false]],
      [['priority', 'asc'], ['createdAt', 'desc']]
    );
  }
}

/**
 * Factory function to create a PlannedPurchasesService instance for a specific user
 */
export const createPlannedPurchasesService = (userId: string): PlannedPurchasesService => {
  const service = new PlannedPurchasesService(`users/${userId}/${SUBCOLLECTIONS.USER_PLANNED_PURCHASES}`);
  return service;
};
