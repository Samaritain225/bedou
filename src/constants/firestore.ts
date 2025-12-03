/**
 * Firestore Collection Names
 * Centralized constants for all top-level Firestore collections
 * User-specific data is stored in subcollections under users/{userId}/
 */
export const COLLECTIONS = {
  USERS: 'users',
  CURRENCIES: 'currencies',
} as const;

/**
 * Subcollections (nested collections under user documents)
 */
export const SUBCOLLECTIONS = {
  USER_TRANSACTIONS: 'transactions',
  USER_CATEGORIES: 'categories',
  USER_BUDGETS: 'budgets',
  USER_WALLETS: 'wallets',
  USER_PLANNED_PURCHASES: 'plannedPurchases',
  USER_RECURRING_BILLS: 'recurringBills',
  USER_MONTHLY_BUDGETS: 'monthlyBudgets',
} as const;

/**
 * Firestore field names
 */
export const FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  DELETED_AT: 'deletedAt',
  USER_ID: 'userId',
  IS_SYNCED: 'isSynced',
  SYNC_STATUS: 'syncStatus',
} as const;

/**
 * Sync status values
 */
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  ERROR: 'error',
} as const;

/**
 * Helper function to get user-specific collection path
 */
export const getUserCollectionPath = (userId: string, subcollection: string) => {
  return `${COLLECTIONS.USERS}/${userId}/${subcollection}`;
};
