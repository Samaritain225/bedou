import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Base document interface with common fields
 */
export interface BaseDocument {
  id?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | string;
  updatedAt?: FirebaseFirestoreTypes.Timestamp | string;
  deletedAt?: FirebaseFirestoreTypes.Timestamp | string | null;
}

/**
 * User data structure
 */
export interface UserDocument extends BaseDocument {
  phoneNumber: string;
  displayName: string;
  email?: string;
  photoURL: string | null;
  baseCurrency: string;
}

/**
 * Transaction document structure
 */
export interface TransactionDocument extends BaseDocument {
  dateISO: string;
  amountOriginal: number;
  currencyCode: string;
  amountBase: number;
  categoryId?: string;
  note?: string;
  type: 'expense' | 'income';
  tags?: string[];
  paymentMethod?: string;
  userId: string;
}

/**
 * Category document structure
 */
export interface CategoryDocument extends BaseDocument {
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income';
  userId: string;
}

/**
 * Budget document structure
 */
export interface BudgetDocument extends BaseDocument {
  categoryId: string;
  monthYYYYMM: string;
  amountBase: number;
  userId: string;
}

/**
 * Wallet document structure
 */
export interface WalletDocument extends BaseDocument {
  name: string;
  amountBase: number;
  currencyCode: string;
  userId: string;
}

/**
 * Planned purchase document structure
 */
export interface PlannedPurchaseDocument extends BaseDocument {
  name: string;
  amountBase: number;
  priority: 'high' | 'medium' | 'low';
  categoryId?: string;
  note?: string;
  isPurchased: boolean;
  purchasedAt?: FirebaseFirestoreTypes.Timestamp;
  userId: string;
}

/**
 * Recurring bill document structure
 */
export interface RecurringBillDocument extends BaseDocument {
  name: string;
  amountBase: number;
  currencyCode: string;
  categoryId?: string;
  paymentMethod?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  isActive: boolean;
  note?: string;
  userId: string;
}

/**
 * Monthly budget document structure
 */
export interface MonthlyBudgetDocument extends BaseDocument {
  monthYYYYMM: string;
  amountBase: number;
  userId: string;
}

/**
 * Currency document structure
 */
export interface CurrencyDocument extends BaseDocument {
  code: string;
  label: string;
  symbol: string;
  rateToBase: number;
  isBase: boolean;
}
