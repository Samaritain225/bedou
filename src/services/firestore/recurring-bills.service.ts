import { SUBCOLLECTIONS } from '@/src/constants/firestore';
import { RecurringBillDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Recurring Bills Service
 * Handles all recurring bill-related Firestore operations
 * Uses subcollections: users/{userId}/recurringBills
 */
class RecurringBillsService extends BaseFirestoreService<RecurringBillDocument> {
  /**
   * Get all recurring bills
   */
  async getRecurringBills(): Promise<RecurringBillDocument[]> {
    return this.getAll(undefined, [['nextDueDate', 'asc']]);
  }

  /**
   * Get active recurring bills
   */
  async getActiveRecurringBills(): Promise<RecurringBillDocument[]> {
    return this.getAll(
      [['isActive', '==', true]],
      [['nextDueDate', 'asc']]
    );
  }

  /**
   * Get inactive recurring bills
   */
  async getInactiveRecurringBills(): Promise<RecurringBillDocument[]> {
    return this.getAll(
      [['isActive', '==', false]],
      [['updatedAt', 'desc']]
    );
  }

  /**
   * Get bills by frequency
   */
  async getByFrequency(frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<RecurringBillDocument[]> {
    return this.getAll(
      [
        ['frequency', '==', frequency],
        ['isActive', '==', true],
      ],
      [['nextDueDate', 'asc']]
    );
  }

  /**
   * Get bills due soon (within the next X days)
   */
  async getBillsDueSoon(daysAhead: number = 7): Promise<RecurringBillDocument[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return this.getAll(
      [
        ['isActive', '==', true],
        ['nextDueDate', '>=', today],
        ['nextDueDate', '<=', futureDateStr],
      ],
      [['nextDueDate', 'asc']]
    );
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.update(id, { isActive } as Partial<RecurringBillDocument>);
  }

  /**
   * Update next due date
   */
  async updateNextDueDate(id: string, nextDueDate: string): Promise<void> {
    await this.update(id, { nextDueDate } as Partial<RecurringBillDocument>);
  }

  /**
   * Listen to active recurring bills in real-time
   */
  onActiveRecurringBillsSnapshot(
    callback: (data: RecurringBillDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [['isActive', '==', true]],
      [['nextDueDate', 'asc']]
    );
  }
}

/**
 * Factory function to create a RecurringBillsService instance for a specific user
 */
export const createRecurringBillsService = (userId: string): RecurringBillsService => {
  const service = new RecurringBillsService(`users/${userId}/${SUBCOLLECTIONS.USER_RECURRING_BILLS}`);
  return service;
};
