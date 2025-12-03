import { SUBCOLLECTIONS } from '@/src/constants/firestore';
import { BudgetDocument, MonthlyBudgetDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Budgets Service
 * Handles all budget-related Firestore operations
 * Uses subcollections: users/{userId}/budgets
 */
class BudgetsService extends BaseFirestoreService<BudgetDocument> {
  /**
   * Get budget for a specific category and month
   */
  async getBudgetForCategoryMonth(
    categoryId: string,
    monthYYYYMM: string
  ): Promise<BudgetDocument | null> {
    const budgets = await this.getAll([
      ['categoryId', '==', categoryId],
      ['monthYYYYMM', '==', monthYYYYMM],
    ]);
    return budgets.length > 0 ? budgets[0] : null;
  }

  /**
   * Get all budgets for a specific month
   */
  async getBudgetsForMonth(monthYYYYMM: string): Promise<BudgetDocument[]> {
    return this.getAll([['monthYYYYMM', '==', monthYYYYMM]]);
  }

  /**
   * Get all budgets
   */
  async getBudgets(): Promise<BudgetDocument[]> {
    return this.getAll(undefined, [['monthYYYYMM', 'desc']]);
  }

  /**
   * Listen to budgets for a specific month
   */
  onMonthBudgetsSnapshot(
    monthYYYYMM: string,
    callback: (data: BudgetDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [['monthYYYYMM', '==', monthYYYYMM]]
    );
  }

  /**
   * Create or update a budget
   */
  async upsertBudget(budget: Omit<BudgetDocument, 'id'> & { id?: string }): Promise<string> {
    const existing = await this.getBudgetForCategoryMonth(
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

/**
 * Factory function to create a BudgetsService instance for a specific user
 */
export const createBudgetsService = (userId: string): BudgetsService => {
  const service = new BudgetsService(`users/${userId}/${SUBCOLLECTIONS.USER_BUDGETS}`);
  return service;
};

/**
 * Monthly Budgets Service
 * Handles overall monthly budget operations
 * Uses subcollections: users/{userId}/monthlyBudgets
 */
class MonthlyBudgetsService extends BaseFirestoreService<MonthlyBudgetDocument> {
  /**
   * Get monthly budget for a specific month
   */
  async getMonthlyBudget(monthYYYYMM: string): Promise<MonthlyBudgetDocument | null> {
    const budgets = await this.getAll([['monthYYYYMM', '==', monthYYYYMM]]);
    return budgets.length > 0 ? budgets[0] : null;
  }

  /**
   * Create or update a monthly budget
   */
  async upsertMonthlyBudget(budget: Omit<MonthlyBudgetDocument, 'id'> & { id?: string }): Promise<string> {
    const existing = await this.getMonthlyBudget(budget.monthYYYYMM);

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
  async deleteMonthlyBudget(monthYYYYMM: string): Promise<void> {
    const existing = await this.getMonthlyBudget(monthYYYYMM);
    if (existing && existing.id) {
      await this.delete(existing.id);
    }
  }
}

/**
 * Factory function to create a MonthlyBudgetsService instance for a specific user
 */
export const createMonthlyBudgetsService = (userId: string): MonthlyBudgetsService => {
  const service = new MonthlyBudgetsService(`users/${userId}/${SUBCOLLECTIONS.USER_MONTHLY_BUDGETS}`);
  return service;
};
