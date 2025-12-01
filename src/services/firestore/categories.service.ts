import { COLLECTIONS } from '@/src/constants/firestore';
import { CategoryDocument } from '@/src/types/firestore';
import { BaseFirestoreService } from './base.service';

/**
 * Categories Service
 * Handles all category-related Firestore operations
 */
class CategoriesService extends BaseFirestoreService<CategoryDocument> {
  constructor() {
    super(COLLECTIONS.CATEGORIES);
  }

  /**
   * Get categories by user
   */
  async getUserCategories(userId: string): Promise<CategoryDocument[]> {
    return this.getAll(
      [['userId', '==', userId]],
      [['name', 'asc']]
    );
  }

  /**
   * Get categories by type
   */
  async getCategoriesByType(
    userId: string,
    type: 'expense' | 'income'
  ): Promise<CategoryDocument[]> {
    return this.getAll(
      [
        ['userId', '==', userId],
        ['type', '==', type],
      ],
      [['name', 'asc']]
    );
  }

  /**
   * Get category by name
   */
  async getCategoryByName(userId: string, name: string): Promise<CategoryDocument | null> {
    const categories = await this.getAll([
      ['userId', '==', userId],
      ['name', '==', name],
    ]);
    return categories.length > 0 ? categories[0] : null;
  }

  /**
   * Listen to user's categories in real-time
   */
  onUserCategoriesSnapshot(
    userId: string,
    callback: (data: CategoryDocument[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.onSnapshot(
      callback,
      onError,
      [['userId', '==', userId]],
      [['name', 'asc']]
    );
  }
}

export const categoriesService = new CategoriesService();
