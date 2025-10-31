import { generateUuid, withTransaction } from "../../db";
import { Budget } from "../categories/types";

/**
 * Get current month in YYYYMM format (e.g., "202401" for January 2024)
 */
export function getCurrentMonthYYYYMM(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

/**
 * Format Date to YYYYMM string
 */
export function dateToYYYYMM(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

/**
 * Parse YYYYMM string to Date (first day of month)
 */
export function yyyymmToDate(yyyymm: string): Date {
  const year = Number.parseInt(yyyymm.substring(0, 4), 10);
  const month = Number.parseInt(yyyymm.substring(4, 6), 10) - 1;
  return new Date(year, month, 1);
}

export async function listBudgets(
  monthYYYYMM?: string,
  db?: any
): Promise<Budget[]> {
  try {
    const targetMonth = monthYYYYMM || getCurrentMonthYYYYMM();
    if (db) {
      const rows = await db.getAllAsync(
        "SELECT * FROM budgets WHERE monthYYYYMM = ? ORDER BY categoryId ASC",
        targetMonth
      );
      return Array.isArray(rows) ? rows : [];
    }
    const result = await withTransaction(async (tx) => {
      const rows = await tx.getAllAsync(
        "SELECT * FROM budgets WHERE monthYYYYMM = ? ORDER BY categoryId ASC",
        targetMonth
      );
      return rows ?? [];
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error listing budgets:", error);
    return [];
  }
}

export async function getBudgetByCategoryAndMonth(
  categoryId: string,
  monthYYYYMM: string,
  db?: any
): Promise<Budget | null> {
  try {
    if (db) {
      const row = await db.getFirstAsync(
        "SELECT * FROM budgets WHERE categoryId = ? AND monthYYYYMM = ?",
        categoryId,
        monthYYYYMM
      );
      return row || null;
    }
    const result = await withTransaction(async (tx) => {
      return await tx.getFirstAsync(
        "SELECT * FROM budgets WHERE categoryId = ? AND monthYYYYMM = ?",
        categoryId,
        monthYYYYMM
      );
    });
    return result || null;
  } catch (error) {
    console.error("Error getting budget:", error);
    return null;
  }
}

export async function upsertBudget(
  budget: Omit<Budget, "id"> & { id?: string },
  db?: any
): Promise<string> {
  const budgetId = budget.id || generateUuid();
  if (db) {
    await db.runAsync(
      "INSERT OR REPLACE INTO budgets (id, categoryId, monthYYYYMM, amountBase) VALUES (?,?,?,?)",
      budgetId,
      budget.categoryId,
      budget.monthYYYYMM,
      budget.amountBase
    );
  } else {
    await withTransaction(async (tx) => {
      await tx.runAsync(
        "INSERT OR REPLACE INTO budgets (id, categoryId, monthYYYYMM, amountBase) VALUES (?,?,?,?)",
        budgetId,
        budget.categoryId,
        budget.monthYYYYMM,
        budget.amountBase
      );
    });
  }
  return budgetId;
}

export async function deleteBudget(id: string, db?: any): Promise<void> {
  if (db) {
    await db.runAsync("DELETE FROM budgets WHERE id=?", id);
  } else {
    await withTransaction(async (tx) => {
      await tx.runAsync("DELETE FROM budgets WHERE id=?", id);
    });
  }
}

export async function deleteBudgetsByCategory(
  categoryId: string,
  db?: any
): Promise<void> {
  if (db) {
    await db.runAsync("DELETE FROM budgets WHERE categoryId=?", categoryId);
  } else {
    await withTransaction(async (tx) => {
      await tx.runAsync("DELETE FROM budgets WHERE categoryId=?", categoryId);
    });
  }
}
