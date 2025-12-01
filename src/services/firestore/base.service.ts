import { FIELDS } from '@/src/constants/firestore';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type WhereClause = [string, FirebaseFirestoreTypes.WhereFilterOp, any];
export type OrderByClause = [string, 'asc' | 'desc'];

/**
 * Base Firestore Service
 * Provides reusable CRUD operations for all collections following DRY principle
 */
export class BaseFirestoreService<T extends { id?: string }> {
  protected collection: FirebaseFirestoreTypes.CollectionReference;

  constructor(collectionPath: string) {
    this.collection = firestore().collection(collectionPath);
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = this.collection.doc();
    const timestamp = firestore.FieldValue.serverTimestamp();

    await docRef.set({
      ...data,
      id: docRef.id,
      [FIELDS.CREATED_AT]: timestamp,
      [FIELDS.UPDATED_AT]: timestamp,
    });

    return docRef.id;
  }

  /**
   * Create a document with a specific ID
   */
  async createWithId(id: string, data: Omit<T, 'id'>): Promise<void> {
    const timestamp = firestore.FieldValue.serverTimestamp();

    await this.collection.doc(id).set({
      ...data,
      id,
      [FIELDS.CREATED_AT]: timestamp,
      [FIELDS.UPDATED_AT]: timestamp,
    });
  }

  /**
   * Get document by ID
   */
  async getById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists() ? (doc.data() as T) : null;
  }

  /**
   * Get all documents with optional filtering and ordering
   */
  async getAll(
    where?: WhereClause[],
    orderBy?: OrderByClause[],
    limit?: number
  ): Promise<T[]> {
    let query: FirebaseFirestoreTypes.Query = this.collection;

    // Apply where clauses
    if (where) {
      where.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });
    }

    // Apply ordering
    if (orderBy) {
      orderBy.forEach(([field, direction]) => {
        query = query.orderBy(field, direction);
      });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as T);
  }

  /**
   * Update document
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      [FIELDS.UPDATED_AT]: firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Delete document (soft delete by default)
   */
  async delete(id: string, softDelete = true): Promise<void> {
    if (softDelete) {
      await this.collection.doc(id).update({
        [FIELDS.DELETED_AT]: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await this.collection.doc(id).delete();
    }
  }

  /**
   * Hard delete (permanent)
   */
  async hardDelete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  /**
   * Listen to real-time updates
   */
  onSnapshot(
    callback: (data: T[]) => void,
    onError?: (error: Error) => void,
    where?: WhereClause[],
    orderBy?: OrderByClause[]
  ): () => void {
    let query: FirebaseFirestoreTypes.Query = this.collection;

    if (where) {
      where.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });
    }

    if (orderBy) {
      orderBy.forEach(([field, direction]) => {
        query = query.orderBy(field, direction);
      });
    }

    return query.onSnapshot(
      snapshot => {
        const data = snapshot.docs.map(doc => doc.data() as T);
        callback(data);
      },
      error => {
        console.error('Snapshot error:', error);
        onError?.(error);
      }
    );
  }

  /**
   * Listen to a single document in real-time
   */
  onDocumentSnapshot(
    id: string,
    callback: (data: T | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.collection.doc(id).onSnapshot(
      snapshot => {
        const data = snapshot.exists() ? (snapshot.data() as T) : null;
        callback(data);
      },
      error => {
        console.error('Document snapshot error:', error);
        onError?.(error);
      }
    );
  }

  /**
   * Batch write operations
   */
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: any;
  }>): Promise<void> {
    const batch = firestore().batch();
    const timestamp = firestore.FieldValue.serverTimestamp();

    operations.forEach(op => {
      const docRef = op.id
        ? this.collection.doc(op.id)
        : this.collection.doc();

      switch (op.type) {
        case 'create':
          batch.set(docRef, {
            ...op.data,
            id: docRef.id,
            [FIELDS.CREATED_AT]: timestamp,
            [FIELDS.UPDATED_AT]: timestamp,
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...op.data,
            [FIELDS.UPDATED_AT]: timestamp,
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    await batch.commit();
  }

  /**
   * Count documents matching criteria
   */
  async count(where?: WhereClause[]): Promise<number> {
    let query: FirebaseFirestoreTypes.Query = this.collection;

    if (where) {
      where.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });
    }

    const snapshot = await query.count().get();
    return snapshot.data().count;
  }
}
