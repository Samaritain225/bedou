import { SUBCOLLECTIONS } from '@/src/constants/firestore';
import { CategoryDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Categories Service
 * Handles all category-related Firestore operations
 * Uses subcollections: users/{userId}/categories
 */
class CategoriesService extends BaseFirestoreService<CategoryDocument> {
  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryDocument[]> {
    return this.getAll(undefined, [['name', 'asc']]);
  }

  /**
   * Get categories by type
   */
  async getCategoriesByType(type: 'expense' | 'income'): Promise<CategoryDocument[]> {
    return this.getAll(
      [['type', '==', type]],
      [['name', 'asc']]
    );
  }

  /**
   * Listen to user's categories in real-time
   */
  onCategoriesSnapshot(
    callback: (data: CategoryDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      undefined,
      [['name', 'asc']]
    );
  }
}

/**
 * Factory function to create a CategoriesService instance for a specific user
 */
export const createCategoriesService = (userId: string): CategoriesService => {
  const service = new CategoriesService(`users/${userId}/${SUBCOLLECTIONS.USER_CATEGORIES}`);
  return service;
};
