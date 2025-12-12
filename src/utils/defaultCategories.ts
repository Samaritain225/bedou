import { CategoryDocument } from '@/src/types/firestore';

/**
 * Type for category data without auto-generated fields
 */
type CategoryData = Omit<CategoryDocument, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Default categories to create for new users
 * These provide a good starting point for expense tracking
 */
export const DEFAULT_EXPENSE_CATEGORIES: CategoryData[] = [
  {
    name: 'Food',
    type: 'expense',
    icon: 'restaurant',
    color: '#FF7043',
  },
  {
    name: 'Transportation',
    type: 'expense',
    icon: 'car',
    color: '#42A5F5',
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: 'cart',
    color: '#EC407A',
  },
  {
    name: 'Bills',
    type: 'expense',
    icon: 'flash',
    color: '#FFA726',
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'musical-notes',
    color: '#AB47BC',
  },
  {
    name: 'Health',
    type: 'expense',
    icon: 'medical',
    color: '#66BB6A',
  },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryData[] = [
  {
    name: 'Salary',
    type: 'income',
    icon: 'wallet',
    color: '#26A69A',
  },
  {
    name: 'Freelance',
    type: 'income',
    icon: 'briefcase',
    color: '#5C6BC0',
  },
];

/**
 * Get all default categories (expense + income)
 */
export function getDefaultCategories(): CategoryData[] {
  return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
}

