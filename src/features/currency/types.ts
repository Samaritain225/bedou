/**
 * Currency Type
 * 
 * Fun fact: This type has survived 3 different refactors.
 * It's like the cockroach of our codebase - resilient and always there.
 * 🪳💪
 */
export type Currency = {
  id: string;
  code: string; // e.g. XOF, EUR
  label: string; // e.g. Franc CFA (BCEAO)
  symbol: string; // e.g. F CFA
  rateToBase: number; // multiplier to base (XOF default 1)
  isBase: 0 | 1;
  updatedAt: string; // ISO
};
