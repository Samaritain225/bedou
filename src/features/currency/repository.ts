import { withTransaction } from "../../db";
import { Currency } from "./types";

// Accept db parameter for useDb() hook, fallback to withTransaction for compatibility
export async function listCurrencies(db?: any): Promise<Currency[]> {
  try {
    if (db) {
      // Use provided db (from useDb() hook)
      const rows = await db.getAllAsync(
        "SELECT * FROM currencies ORDER BY isBase DESC, code ASC"
      );
      return Array.isArray(rows) ? rows : [];
    }
    // Fallback: use withTransaction for backward compatibility
    const result = await withTransaction(async (tx) => {
      const rows = await tx.getAllAsync(
        "SELECT * FROM currencies ORDER BY isBase DESC, code ASC"
      );
      return rows ?? [];
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error listing currencies:", error);
    return [];
  }
}

export async function addCurrency(
  cur: Omit<Currency, "updatedAt"> & { updatedAt?: string },
  db?: any
): Promise<void> {
  const now = cur.updatedAt ?? new Date().toISOString();
  if (db) {
    // Use provided db (from useDb() hook)
    await db.runAsync(
      "INSERT INTO currencies (id, code, label, symbol, rateToBase, isBase, updatedAt) VALUES (?,?,?,?,?,?,?)",
      cur.id,
      cur.code,
      cur.label,
      cur.symbol,
      cur.rateToBase,
      cur.isBase ?? 0,
      now
    );
  } else {
    // Fallback: use withTransaction for backward compatibility
    await withTransaction(async (tx) => {
      await tx.runAsync(
        "INSERT INTO currencies (id, code, label, symbol, rateToBase, isBase, updatedAt) VALUES (?,?,?,?,?,?,?)",
        cur.id,
        cur.code,
        cur.label,
        cur.symbol,
        cur.rateToBase,
        cur.isBase ?? 0,
        now
      );
    });
  }
}

export async function updateCurrencyRate(
  id: string,
  rateToBase: number,
  db?: any
): Promise<void> {
  if (db) {
    await db.runAsync(
      "UPDATE currencies SET rateToBase=?, updatedAt=? WHERE id=?",
      rateToBase,
      new Date().toISOString(),
      id
    );
  } else {
    await withTransaction(async (tx) => {
      await tx.runAsync(
        "UPDATE currencies SET rateToBase=?, updatedAt=? WHERE id=?",
        rateToBase,
        new Date().toISOString(),
        id
      );
    });
  }
}

export async function setBaseCurrency(id: string, db?: any): Promise<void> {
  if (db) {
    await db.execAsync("UPDATE currencies SET isBase=0;");
    await db.runAsync("UPDATE currencies SET isBase=1 WHERE id=?", id);
  } else {
    await withTransaction(async (tx) => {
      await tx.execAsync("UPDATE currencies SET isBase=0;");
      await tx.runAsync("UPDATE currencies SET isBase=1 WHERE id=?", id);
    });
  }
}
