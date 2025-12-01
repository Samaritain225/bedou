import { COLLECTIONS } from '@/src/constants/firestore';
import { RecurringBillDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Recurring Bills Service
 * Handles all recurring bill-related Firestore operations
 */
class RecurringBillsService extends BaseFirestoreService<RecurringBillDocument> {
  constructor() {
    super(COLLECTIONS.RECURRING_BILLS);
  }

  /**
   * Get all recurring bills for a user
   */
  async getUserRecurringBills(userId: string): Promise<RecurringBillDocument[]> {
    return this.getAll(
      [['userId', '==', userId]],
      [['nextDueDate', 'asc']]
    );
  }

  /**
   * Get active recurring bills
   */
  async getActiveRecurringBills(userId: string): Promise<RecurringBillDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['isActive', '==', true],
      ],
      [['nextDueDate', 'asc']]
    );
  }

  /**
   * Get inactive recurring bills
   */
  async getInactiveRecurringBills(userId: string): Promise<RecurringBillDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['isActive', '==', false],
      ],
      [['updatedAt', 'desc']]
    );
  }

  /**
   * Get bills by frequency
   */
  async getByFrequency(
    userId: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<RecurringBillDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['frequency', '==', frequency],
        ['isActive', '==', true],
      ],
      [['nextDueDate', 'asc']]
    );
  }

  /**
   * Get bills due soon (within the next X days)
   */
  async getBillsDueSoon(userId: string, daysAhead: number = 7): Promise<RecurringBillDocument[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return this.getAll(
      [
        ['userId', '==', userId],
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
    userId: string,
    callback: (data: RecurringBillDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [
        ['userId', '==', userId],
        ['isActive', '==', true],
      ],
      [['nextDueDate', 'asc']]
    );
  }
}

export const recurringBillsService = new RecurringBillsService();
