import { withTransaction } from "../../db";
import { Transaction } from "./types";

export async function listTransactions(
  db?: any,
  filters?: {
    categoryId?: string;
    type?: "expense" | "income";
    startDate?: string;
    endDate?: string;
  }
): Promise<Transaction[]> {
  try {
    let query = "SELECT * FROM transactions WHERE 1=1";
    const params: any[] = [];

    if (filters?.categoryId) {
      query += " AND categoryId = ?";
      params.push(filters.categoryId);
    }

    if (filters?.type) {
      query += " AND type = ?";
      params.push(filters.type);
    }

    if (filters?.startDate) {
      query += " AND dateISO >= ?";
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += " AND dateISO <= ?";
      params.push(filters.endDate);
    }

    query += " ORDER BY dateISO DESC, id DESC";

    if (db) {
      const rows = await db.getAllAsync(query, ...params);
      return Array.isArray(rows) ? rows : [];
    }
    const result = await withTransaction(async (tx) => {
      const rows = await tx.getAllAsync(query, ...params);
      return rows ?? [];
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error listing transactions:", error);
    return [];
  }
}

export async function getTransactionById(
  id: string,
  db?: any
): Promise<Transaction | null> {
  try {
    if (db) {
      const row = await db.getFirstAsync(
        "SELECT * FROM transactions WHERE id = ?",
        id
      );
      return row || null;
    }
    const result = await withTransaction(async (tx) => {
      return await tx.getFirstAsync("SELECT * FROM transactions WHERE id = ?", id);
    });
    return result || null;
  } catch (error) {
    console.error("Error getting transaction:", error);
    return null;
  }
}

export async function updateTransaction(
  transaction: Transaction,
  db?: any
): Promise<void> {
  try {
    if (db) {
      await db.runAsync(
        "UPDATE transactions SET dateISO=?, amountOriginal=?, currencyCode=?, amountBase=?, categoryId=?, note=?, type=?, tagsJSON=? WHERE id=?",
        transaction.dateISO,
        transaction.amountOriginal,
        transaction.currencyCode,
        transaction.amountBase,
        transaction.categoryId,
        transaction.note,
        transaction.type,
        transaction.tagsJSON,
        transaction.id
      );
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync(
          "UPDATE transactions SET dateISO=?, amountOriginal=?, currencyCode=?, amountBase=?, categoryId=?, note=?, type=?, tagsJSON=? WHERE id=?",
          transaction.dateISO,
          transaction.amountOriginal,
          transaction.currencyCode,
          transaction.amountBase,
          transaction.categoryId,
          transaction.note,
          transaction.type,
          transaction.tagsJSON,
          transaction.id
        );
      });
    }
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
}

export async function deleteTransaction(id: string, db?: any): Promise<void> {
  try {
    if (db) {
      await db.runAsync("DELETE FROM transactions WHERE id=?", id);
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync("DELETE FROM transactions WHERE id=?", id);
      });
    }
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
}

