import { PaymentMethod } from "../transactions/types";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringBill {
  id: string;
  name: string;
  amountBase: number; // Amount in base currency (integer, stored as smallest unit * 100)
  currencyCode: string; // e.g. "XOF", "EUR"
  categoryId: string | null;
  paymentMethod: PaymentMethod | null;
  frequency: RecurringFrequency;
  nextDueDate: string; // ISO date string
  isActive: number; // SQLite boolean: 0 = false, 1 = true
  note: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

