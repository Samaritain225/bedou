export interface Wallet {
  id: string;
  name: string;
  amountBase: number; // Balance in base currency (integer, stored as smallest unit * 100)
  currencyCode: string; // e.g. "XOF", "EUR"
  updatedAt: string; // ISO date string
  createdAt: string; // ISO date string
}

