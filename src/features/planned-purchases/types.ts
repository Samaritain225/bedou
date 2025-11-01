export type Priority = "high" | "medium" | "low";

export interface PlannedPurchase {
  id: string;
  name: string;
  amountBase: number; // Amount in base currency (integer, stored as smallest unit * 100)
  priority: Priority;
  categoryId: string | null;
  note: string | null;
  isPurchased: number; // SQLite boolean: 0 = false, 1 = true
  purchasedAt: string | null; // ISO date string
  createdAt: string; // ISO date string
}

