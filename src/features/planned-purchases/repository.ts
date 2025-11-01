import { generateUuid, withTransaction } from "@/src/db";
import { PlannedPurchase, Priority } from "./types";

export async function listPlannedPurchases(
  db?: any,
  filters?: {
    isPurchased?: boolean;
    priority?: Priority;
    categoryId?: string;
  }
): Promise<PlannedPurchase[]> {
  try {
    let query = "SELECT * FROM planned_purchases WHERE 1=1";
    const params: any[] = [];

    if (filters?.isPurchased !== undefined) {
      query += " AND isPurchased = ?";
      params.push(filters.isPurchased ? 1 : 0);
    }

    if (filters?.priority) {
      query += " AND priority = ?";
      params.push(filters.priority);
    }

    if (filters?.categoryId) {
      query += " AND categoryId = ?";
      params.push(filters.categoryId);
    }

    query += " ORDER BY isPurchased ASC, priority ASC, createdAt DESC";

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
    console.error("Error listing planned purchases:", error);
    return [];
  }
}

export async function getPlannedPurchaseById(
  id: string,
  db?: any
): Promise<PlannedPurchase | null> {
  try {
    if (db) {
      const row = await db.getFirstAsync(
        "SELECT * FROM planned_purchases WHERE id = ?",
        id
      );
      return row || null;
    }
    const result = await withTransaction(async (tx) => {
      return await tx.getFirstAsync(
        "SELECT * FROM planned_purchases WHERE id = ?",
        id
      );
    });
    return result || null;
  } catch (error) {
    console.error("Error getting planned purchase:", error);
    return null;
  }
}

export async function addPlannedPurchase(
  purchase: Omit<PlannedPurchase, "id" | "createdAt" | "isPurchased" | "purchasedAt"> & {
    id?: string;
    createdAt?: string;
  },
  db?: any
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const purchaseId = purchase.id || generateUuid();

    if (db) {
      await db.runAsync(
        "INSERT INTO planned_purchases (id, name, amountBase, priority, categoryId, note, isPurchased, purchasedAt, createdAt) VALUES (?,?,?,?,?,?,?,?,?)",
        purchaseId,
        purchase.name,
        purchase.amountBase,
        purchase.priority,
        purchase.categoryId,
        purchase.note,
        0, // isPurchased = false
        null, // purchasedAt = null
        purchase.createdAt || now
      );
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync(
          "INSERT INTO planned_purchases (id, name, amountBase, priority, categoryId, note, isPurchased, purchasedAt, createdAt) VALUES (?,?,?,?,?,?,?,?,?)",
          purchaseId,
          purchase.name,
          purchase.amountBase,
          purchase.priority,
          purchase.categoryId,
          purchase.note,
          0, // isPurchased = false
          null, // purchasedAt = null
          purchase.createdAt || now
        );
      });
    }

    return purchaseId;
  } catch (error) {
    console.error("Error adding planned purchase:", error);
    throw error;
  }
}

export async function updatePlannedPurchase(
  purchase: PlannedPurchase,
  db?: any
): Promise<void> {
  try {
    if (db) {
      await db.runAsync(
        "UPDATE planned_purchases SET name=?, amountBase=?, priority=?, categoryId=?, note=?, isPurchased=?, purchasedAt=? WHERE id=?",
        purchase.name,
        purchase.amountBase,
        purchase.priority,
        purchase.categoryId,
        purchase.note,
        purchase.isPurchased,
        purchase.purchasedAt,
        purchase.id
      );
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync(
          "UPDATE planned_purchases SET name=?, amountBase=?, priority=?, categoryId=?, note=?, isPurchased=?, purchasedAt=? WHERE id=?",
          purchase.name,
          purchase.amountBase,
          purchase.priority,
          purchase.categoryId,
          purchase.note,
          purchase.isPurchased,
          purchase.purchasedAt,
          purchase.id
        );
      });
    }
  } catch (error) {
    console.error("Error updating planned purchase:", error);
    throw error;
  }
}

export async function markAsPurchased(
  id: string,
  db?: any
): Promise<void> {
  try {
    const now = new Date().toISOString();
    if (db) {
      await db.runAsync(
        "UPDATE planned_purchases SET isPurchased=1, purchasedAt=? WHERE id=?",
        now,
        id
      );
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync(
          "UPDATE planned_purchases SET isPurchased=1, purchasedAt=? WHERE id=?",
          now,
          id
        );
      });
    }
  } catch (error) {
    console.error("Error marking planned purchase as purchased:", error);
    throw error;
  }
}

export async function unmarkAsPurchased(
  id: string,
  db?: any
): Promise<void> {
  try {
    if (db) {
      await db.runAsync(
        "UPDATE planned_purchases SET isPurchased=0, purchasedAt=NULL WHERE id=?",
        id
      );
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync(
          "UPDATE planned_purchases SET isPurchased=0, purchasedAt=NULL WHERE id=?",
          id
        );
      });
    }
  } catch (error) {
    console.error("Error unmarking planned purchase as purchased:", error);
    throw error;
  }
}

export async function deletePlannedPurchase(id: string, db?: any): Promise<void> {
  try {
    if (db) {
      await db.runAsync("DELETE FROM planned_purchases WHERE id=?", id);
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync("DELETE FROM planned_purchases WHERE id=?", id);
      });
    }
  } catch (error) {
    console.error("Error deleting planned purchase:", error);
    throw error;
  }
}

