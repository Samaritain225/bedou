import { generateUuid, withTransaction } from "@/src/db";
import { PaymentMethod } from "../transactions/types";
import { RecurringBill, RecurringFrequency } from "./types";

export async function listRecurringBills(
  db?: any,
  filters?: {
    isActive?: boolean;
    categoryId?: string;
    frequency?: RecurringFrequency;
  }
): Promise<RecurringBill[]> {
  try {
    let query = "SELECT * FROM recurring_bills WHERE 1=1";
    const params: any[] = [];

    if (filters?.isActive !== undefined) {
      query += " AND isActive = ?";
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters?.categoryId) {
      query += " AND categoryId = ?";
      params.push(filters.categoryId);
    }

    if (filters?.frequency) {
      query += " AND frequency = ?";
      params.push(filters.frequency);
    }

    query += " ORDER BY nextDueDate ASC, createdAt DESC";

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
    console.error("Error listing recurring bills:", error);
    return [];
  }
}

export async function getRecurringBillById(
  id: string,
  db?: any
): Promise<RecurringBill | null> {
  try {
    if (db) {
      const row = await db.getFirstAsync(
        "SELECT * FROM recurring_bills WHERE id = ?",
        id
      );
      return row || null;
    }
    const result = await withTransaction(async (tx) => {
      return await tx.getFirstAsync(
        "SELECT * FROM recurring_bills WHERE id = ?",
        id
      );
    });
    return result || null;
  } catch (error) {
    console.error("Error getting recurring bill:", error);
    return null;
  }
}

export async function createRecurringBill(
  bill: Omit<RecurringBill, "id" | "createdAt" | "updatedAt" | "isActive"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    isActive?: boolean;
  },
  db?: any
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const billId = bill.id || generateUuid();

    if (db) {
      await db.runAsync(
        "INSERT INTO recurring_bills (id, name, amountBase, currencyCode, categoryId, paymentMethod, frequency, nextDueDate, isActive, note, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        billId,
        bill.name,
        bill.amountBase,
        bill.currencyCode,
        bill.categoryId,
        bill.paymentMethod,
        bill.frequency,
        bill.nextDueDate,
        bill.isActive !== undefined ? (bill.isActive ? 1 : 0) : 1,
        bill.note,
        bill.createdAt || now,
        bill.updatedAt || now
      );
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync(
          "INSERT INTO recurring_bills (id, name, amountBase, currencyCode, categoryId, paymentMethod, frequency, nextDueDate, isActive, note, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
          billId,
          bill.name,
          bill.amountBase,
          bill.currencyCode,
          bill.categoryId,
          bill.paymentMethod,
          bill.frequency,
          bill.nextDueDate,
          bill.isActive !== undefined ? (bill.isActive ? 1 : 0) : 1,
          bill.note,
          bill.createdAt || now,
          bill.updatedAt || now
        );
      });
    }
    return billId;
  } catch (error) {
    console.error("Error creating recurring bill:", error);
    throw error;
  }
}

export async function updateRecurringBill(
  id: string,
  updates: Partial<{
    name: string;
    amountBase: number;
    currencyCode: string;
    categoryId: string | null;
    paymentMethod: PaymentMethod | null;
    frequency: RecurringFrequency;
    nextDueDate: string;
    isActive: boolean;
    note: string | null;
  }>,
  db?: any
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push("name = ?");
      params.push(updates.name);
    }
    if (updates.amountBase !== undefined) {
      updateFields.push("amountBase = ?");
      params.push(updates.amountBase);
    }
    if (updates.currencyCode !== undefined) {
      updateFields.push("currencyCode = ?");
      params.push(updates.currencyCode);
    }
    if (updates.categoryId !== undefined) {
      updateFields.push("categoryId = ?");
      params.push(updates.categoryId);
    }
    if (updates.paymentMethod !== undefined) {
      updateFields.push("paymentMethod = ?");
      params.push(updates.paymentMethod);
    }
    if (updates.frequency !== undefined) {
      updateFields.push("frequency = ?");
      params.push(updates.frequency);
    }
    if (updates.nextDueDate !== undefined) {
      updateFields.push("nextDueDate = ?");
      params.push(updates.nextDueDate);
    }
    if (updates.isActive !== undefined) {
      updateFields.push("isActive = ?");
      params.push(updates.isActive ? 1 : 0);
    }
    if (updates.note !== undefined) {
      updateFields.push("note = ?");
      params.push(updates.note);
    }

    updateFields.push("updatedAt = ?");
    params.push(now);
    params.push(id);

    if (updateFields.length <= 1) {
      // Only updatedAt, no actual updates
      return;
    }

    const query = `UPDATE recurring_bills SET ${updateFields.join(", ")} WHERE id = ?`;

    if (db) {
      await db.runAsync(query, ...params);
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync(query, ...params);
      });
    }
  } catch (error) {
    console.error("Error updating recurring bill:", error);
    throw error;
  }
}

export async function deleteRecurringBill(id: string, db?: any): Promise<void> {
  try {
    if (db) {
      await db.runAsync("DELETE FROM recurring_bills WHERE id = ?", id);
    } else {
      await withTransaction(async (tx) => {
        await tx.runAsync("DELETE FROM recurring_bills WHERE id = ?", id);
      });
    }
  } catch (error) {
    console.error("Error deleting recurring bill:", error);
    throw error;
  }
}

/**
 * Calculate the next due date based on frequency
 */
export function calculateNextDueDate(
  currentDueDate: string,
  frequency: RecurringFrequency
): string {
  const date = new Date(currentDueDate);
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString();
}

/**
 * Process recurring bills that are due and create transactions
 * Returns the number of bills processed
 */
export async function processRecurringBills(
  db?: any,
  onTransactionCreated?: (billId: string, transactionId: string) => void
): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get all active recurring bills that are due
    const dueBills = await listRecurringBills(db, { isActive: true });

    let processedCount = 0;

    for (const bill of dueBills) {
      const dueDate = new Date(bill.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Check if bill is due today or past due
      if (dueDate <= today) {
        try {
          // Create transaction from recurring bill
          const transactionId = generateUuid();
          const transactionDate = new Date().toISOString();

          if (db) {
            await db.runAsync(
              "INSERT INTO transactions (id, dateISO, amountOriginal, currencyCode, amountBase, categoryId, note, type, tagsJSON, paymentMethod) VALUES (?,?,?,?,?,?,?,?,?,?)",
              transactionId,
              transactionDate,
              bill.amountBase,
              bill.currencyCode,
              bill.amountBase,
              bill.categoryId,
              bill.note || `Recurring: ${bill.name}`,
              "expense",
              null,
              bill.paymentMethod
            );

            // Update next due date
            const nextDueDate = calculateNextDueDate(bill.nextDueDate, bill.frequency);
            await db.runAsync(
              "UPDATE recurring_bills SET nextDueDate = ?, updatedAt = ? WHERE id = ?",
              nextDueDate,
              new Date().toISOString(),
              bill.id
            );
          } else {
            await withTransaction(async (tx) => {
              await tx.runAsync(
                "INSERT INTO transactions (id, dateISO, amountOriginal, currencyCode, amountBase, categoryId, note, type, tagsJSON, paymentMethod) VALUES (?,?,?,?,?,?,?,?,?,?)",
                transactionId,
                transactionDate,
                bill.amountBase,
                bill.currencyCode,
                bill.amountBase,
                bill.categoryId,
                bill.note || `Recurring: ${bill.name}`,
                "expense",
                null,
                bill.paymentMethod
              );

              // Update next due date
              const nextDueDate = calculateNextDueDate(bill.nextDueDate, bill.frequency);
              await tx.runAsync(
                "UPDATE recurring_bills SET nextDueDate = ?, updatedAt = ? WHERE id = ?",
                nextDueDate,
                new Date().toISOString(),
                bill.id
              );
            });
          }

          processedCount++;
          if (onTransactionCreated) {
            onTransactionCreated(bill.id, transactionId);
          }
        } catch (error) {
          console.error(`Error processing recurring bill ${bill.id}:`, error);
        }
      }
    }

    return processedCount;
  } catch (error) {
    console.error("Error processing recurring bills:", error);
    throw error;
  }
}

