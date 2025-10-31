export type CategoryType = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthYYYYMM: string; // Format: "202401" for January 2024
  amountBase: number; // Amount in base currency (FCFA)
}
