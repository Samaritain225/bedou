export interface MonthlyBudget {
  id: string;
  monthYYYYMM: string; // Format: YYYYMM (e.g., "202401")
  amountBase: number; // Amount in base currency (integer)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

