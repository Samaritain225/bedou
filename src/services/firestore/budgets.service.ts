import { COLLECTIONS } from '@/src/constants/firestore';
import { BudgetDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Budgets Service
 * Handles all budget-related Firestore operations
 */
class BudgetsService extends BaseFirestoreService<BudgetDocument> {
  constructor() {
    super(COLLECTIONS.BUDGETS);
  }

  /**
   * Get budget for a specific category and month
   */
  async getBudgetForCategoryMonth(
    userId: string,
    categoryId: string,
    monthYYYYMM: string
  ): Promise<BudgetDocument | null> {
    const budgets = await this.getAll([
      ['userId', '==', userId],
      ['categoryId', '==', categoryId],
      ['monthYYYYMM', '==', monthYYYYMM],
    ]);
    return budgets.length > 0 ? budgets[0] : null;
  }

  /**
   * Get all budgets for a specific month
   */
  async getBudgetsForMonth(userId: string, monthYYYYMM: string): Promise<BudgetDocument[]> {
    return this.getAll([
      ['userId', '==', userId],
      ['monthYYYYMM', '==', monthYYYYMM],
    ]);
  }

  /**
   * Get all budgets for a user
   */
  async getUserBudgets(userId: string): Promise<BudgetDocument[]> {
    return this.getAll(
      [['userId', '==', userId]],
      [['monthYYYYMM', 'desc']]
    );
  }

  /**
   * Listen to budgets for a specific month
   */
  onMonthBudgetsSnapshot(
    userId: string,
    monthYYYYMM: string,
    callback: (data: BudgetDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [
        ['userId', '==', userId],
        ['monthYYYYMM', '==', monthYYYYMM],
      ]
    );
  }
  /**
   * Create or update a budget
   */
  async upsertBudget(budget: Omit<BudgetDocument, 'id'> & { id?: string }): Promise<string> {
    const existing = await this.getBudgetForCategoryMonth(
      budget.userId,
      budget.categoryId,
      budget.monthYYYYMM
    );

    if (existing && existing.id) {
      await this.update(existing.id, {
        amountBase: budget.amountBase,
        updatedAt: new Date().toISOString(),
      });
      return existing.id;
    } else {
      return this.create(budget);
    }
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    return this.delete(id);
  }
}

export const budgetsService = new BudgetsService();

/**
 * Monthly Budgets Service
 * Handles overall monthly budget operations
 */
import { MonthlyBudgetDocument } from '@/src/types/firestore';

class MonthlyBudgetsService extends BaseFirestoreService<MonthlyBudgetDocument> {
  constructor() {
    super(COLLECTIONS.MONTHLY_BUDGETS);
  }

  /**
   * Get monthly budget for a specific month
   */
  async getMonthlyBudget(userId: string, monthYYYYMM: string): Promise<MonthlyBudgetDocument | null> {
    const budgets = await this.getAll([
      ['userId', '==', userId],
      ['monthYYYYMM', '==', monthYYYYMM],
    ]);
    return budgets.length > 0 ? budgets[0] : null;
  }

  /**
   * Create or update a monthly budget
   */
  async upsertMonthlyBudget(budget: Omit<MonthlyBudgetDocument, 'id'> & { id?: string }): Promise<string> {
    const existing = await this.getMonthlyBudget(budget.userId, budget.monthYYYYMM);

    if (existing && existing.id) {
      await this.update(existing.id, {
        amountBase: budget.amountBase,
        updatedAt: new Date().toISOString(),
      });
      return existing.id;
    } else {
      return this.create(budget);
    }
  }

  /**
   * Delete a monthly budget
   */
  async deleteMonthlyBudget(userId: string, monthYYYYMM: string): Promise<void> {
    const existing = await this.getMonthlyBudget(userId, monthYYYYMM);
    if (existing && existing.id) {
      await this.delete(existing.id);
    }
  }
}

export const monthlyBudgetsService = new MonthlyBudgetsService();
