export type TransactionType = "expense" | "income";

export type PaymentMethod = "cash" | "card" | "mobile" | "bank_transfer" | "other";

export interface Transaction {
  id: string;
  dateISO: string; // ISO date string
  amountOriginal: number; // Amount in original currency (integer)
  currencyCode: string; // e.g. "XOF", "EUR"
  amountBase: number; // Amount converted to base currency (integer)
  categoryId: string | null;
  note: string | null;
  type: TransactionType;
  tagsJSON: string | null; // JSON array of tags
  paymentMethod: PaymentMethod | null; // Payment method used
}
