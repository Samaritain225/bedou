import { COLLECTIONS } from '@/src/constants/firestore';
import { TransactionDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Transactions Service
 * Handles all transaction-related Firestore operations
 */
class TransactionsService extends BaseFirestoreService<TransactionDocument> {
  constructor() {
    super(COLLECTIONS.TRANSACTIONS);
  }

  /**
   * Get transactions by date range for a user
   */
  async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<TransactionDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['dateISO', '>=', startDate],
        ['dateISO', '<=', endDate],
      ],
      [['dateISO', 'desc']]
    );
  }

  /**
   * Get transactions by category
   */
  async getByCategory(userId: string, categoryId: string): Promise<TransactionDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['categoryId', '==', categoryId],
      ],
      [['dateISO', 'desc']]
    );
  }

  /**
   * Get transactions by type (expense or income)
   */
  async getByType(
    userId: string,
    type: 'expense' | 'income'
  ): Promise<TransactionDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['type', '==', type],
      ],
      [['dateISO', 'desc']]
    );
  }

  /**
   * Get recent transactions
   */
  async getRecent(userId: string, limit: number = 10): Promise<TransactionDocument[]> {
    return this.getAll(
      [['userId', '==', userId]],
      [['dateISO', 'desc']],
      limit
    );
  }

  /**
   * Get transactions for a specific month
   */
  async getByMonth(userId: string, monthYYYYMM: string): Promise<TransactionDocument[]> {
    const startDate = `${monthYYYYMM}-01`;
    const year = parseInt(monthYYYYMM.substring(0, 4));
    const month = parseInt(monthYYYYMM.substring(5, 7));
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthYYYYMM}-${lastDay}`;

    return this.getByDateRange(userId, startDate, endDate);
  }

  /**
   * Get total amount by type for a date range
   */
  async getTotalByType(
    userId: string,
    type: 'expense' | 'income',
    startDate: string,
    endDate: string
  ): Promise<number> {
    const transactions = await this.getAll(
      [
        ['userId', '==', userId],
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
  onUserTransactionsSnapshot(
    userId: string,
    callback: (data: TransactionDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [['userId', '==', userId]],
      [['dateISO', 'desc']]
    );
  }
}

export const transactionsService = new TransactionsService();
