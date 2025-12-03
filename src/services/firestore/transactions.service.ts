import { SUBCOLLECTIONS } from '@/src/constants/firestore';
import { TransactionDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Transactions Service
 * Handles all transaction-related Firestore operations
 * Uses subcollections: users/{userId}/transactions
 */
class TransactionsService extends BaseFirestoreService<TransactionDocument> {
  /**
   * Get transactions by date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<TransactionDocument[]> {
    return this.getAll(
      [
        ['dateISO', '>=', startDate],
        ['dateISO', '<=', endDate],
      ],
      [['dateISO', 'desc']]
    );
  }

  /**
   * Get transactions by category
   */
  async getByCategory(categoryId: string): Promise<TransactionDocument[]> {
    return this.getAll(
      [['categoryId', '==', categoryId]],
      [['dateISO', 'desc']]
    );
  }

  /**
   * Get transactions by type (expense or income)
   */
  async getByType(type: 'expense' | 'income'): Promise<TransactionDocument[]> {
    return this.getAll(
      [['type', '==', type]],
      [['dateISO', 'desc']]
    );
  }

  /**
   * Get recent transactions
   */
  async getRecent(limit: number = 10): Promise<TransactionDocument[]> {
    return this.getAll(
      undefined,
      [['dateISO', 'desc']],
      limit
    );
  }

  /**
   * Get transactions for a specific month
   */
  async getByMonth(monthYYYYMM: string): Promise<TransactionDocument[]> {
    const startDate = `${monthYYYYMM}-01`;
    const year = Number.parseInt(monthYYYYMM.substring(0, 4));
    const month = Number.parseInt(monthYYYYMM.substring(5, 7));
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthYYYYMM}-${lastDay}`;

    return this.getByDateRange(startDate, endDate);
  }

  /**
   * Get total amount by type for a date range
   */
  async getTotalByType(
    type: 'expense' | 'income',
    startDate: string,
    endDate: string
  ): Promise<number> {
    const transactions = await this.getAll(
      [
        ['type', '==', type],
        ['dateISO', '>=', startDate],
        ['dateISO', '<=', endDate],
      ]
    );

    return transactions.reduce((sum, tx) => sum + tx.amountBase, 0);
  }

  /**
   * Listen to user's transactions in real-time
   */
  onTransactionsSnapshot(
    callback: (data: TransactionDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      undefined,
      [['dateISO', 'desc']]
    );
  }
}

/**
 * Factory function to create a TransactionsService instance for a specific user
 */
export const createTransactionsService = (userId: string): TransactionsService => {
  const service = new TransactionsService(`users/${userId}/${SUBCOLLECTIONS.USER_TRANSACTIONS}`);
  return service;
};
