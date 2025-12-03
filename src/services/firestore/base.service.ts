import { FIELDS } from '@/src/constants/firestore';
import {
  collection,
  deleteDoc,
  doc,
  FirebaseFirestoreTypes,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';

type CollectionReference = ReturnType<typeof collection>;
type DocumentReference = ReturnType<typeof doc>;
type Query = ReturnType<typeof query>;
type QuerySnapshot = Awaited<ReturnType<typeof getDocs>>;
type DocumentSnapshot = Awaited<ReturnType<typeof getDoc>>;
type WhereFilterOp = FirebaseFirestoreTypes.WhereFilterOp;

export type WhereClause = [string, WhereFilterOp, any];
export type OrderByClause = [string, 'asc' | 'desc'];

/**
 * Base Firestore Service
 * Provides reusable CRUD operations for all collections following DRY principle
 * Supports both top-level collections and subcollections
 */
export class BaseFirestoreService<T extends { id?: string }> {
  protected collectionRef: CollectionReference;
  protected collectionPath: string;

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
    this.collectionRef = collection(getFirestore(), collectionPath);
  }

  /**
   * Create a service instance for a user subcollection
   * @param userId - The user ID
   * @param subcollectionName - The subcollection name (e.g., 'transactions', 'categories')
   */
  static forUserSubcollection<T extends { id?: string }>(
    this: new (collectionPath: string) => BaseFirestoreService<T>,
    userId: string,
    subcollectionName: string
  ): BaseFirestoreService<T> {
    return new this(`users/${userId}/${subcollectionName}`);
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = doc(this.collectionRef);
    const timestamp = serverTimestamp();

    await setDoc(docRef, {
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
    const timestamp = serverTimestamp();
    const docRef = doc(this.collectionRef, id);

    await setDoc(docRef, {
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
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      if (!data) return null;
      return data as T;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  /**
   * Get all documents with optional filtering and ordering
   */
  async getAll(
    whereClauses?: WhereClause[],
    orderByClauses?: OrderByClause[],
    limitCount?: number
  ): Promise<T[]> {
    const constraints: Parameters<typeof query>[1][] = [];

    // Apply where clauses
    if (whereClauses) {
      whereClauses.forEach(([field, operator, value]) => {
        constraints.push(where(field, operator, value) as any);
      });
    }

    // Apply ordering
    if (orderByClauses) {
      orderByClauses.forEach(([field, direction]) => {
        constraints.push(orderBy(field, direction) as any);
      });
    }

    // Apply limit
    if (limitCount) {
      constraints.push(limit(limitCount) as any);
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap: any) => docSnap.data() as T);
  }

  /**
   * Update document
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      ...data,
      [FIELDS.UPDATED_AT]: serverTimestamp(),
    } as any);
  }

  /**
   * Delete document (soft delete by default)
   */
  async delete(id: string, softDelete = true): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    if (softDelete) {
      await updateDoc(docRef, {
        [FIELDS.DELETED_AT]: serverTimestamp(),
      });
    } else {
      await deleteDoc(docRef);
    }
  }

  /**
   * Hard delete (permanent)
   */
  async hardDelete(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }

  /**
   * Listen to real-time updates
   */
  onSnapshot(
    callback: (data: T[]) => void,
    onError?: (error: Error) => void,
    whereClauses?: WhereClause[],
    orderByClauses?: OrderByClause[]
  ): () => void {
    const constraints: Parameters<typeof query>[1][] = [];

    if (whereClauses) {
      whereClauses.forEach(([field, operator, value]) => {
        constraints.push(where(field, operator, value) as any);
      });
    }

    if (orderByClauses) {
      orderByClauses.forEach(([field, direction]) => {
        constraints.push(orderBy(field, direction) as any);
      });
    }

    const q = constraints.length > 0
      ? query(this.collectionRef, ...constraints)
      : this.collectionRef;

    return onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map((docSnap: any) => docSnap.data() as T);
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
    const docRef = doc(this.collectionRef, id);
    return onSnapshot(
      docRef,
      snapshot => {
        const data = snapshot.data();
        callback(data ? (data as T) : null);
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
    const db = getFirestore();
    const batch = writeBatch(db);

    operations.forEach(op => {
      const docRef = op.id
        ? doc(this.collectionRef, op.id)
        : doc(this.collectionRef);

      switch (op.type) {
        case 'create':
          batch.set(docRef, {
            ...op.data,
            id: docRef.id,
            [FIELDS.CREATED_AT]: serverTimestamp(),
            [FIELDS.UPDATED_AT]: serverTimestamp(),
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...op.data,
            [FIELDS.UPDATED_AT]: serverTimestamp(),
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
  async count(whereClauses?: WhereClause[]): Promise<number> {
    const constraints: Parameters<typeof query>[1][] = [];

    if (whereClauses) {
      whereClauses.forEach(([field, operator, value]) => {
        constraints.push(where(field, operator, value) as any);
      });
    }

    // Note: count() is not available in modular API, we need to use getDocs and count manually
    const q = constraints.length > 0
      ? query(this.collectionRef, ...constraints)
      : this.collectionRef;

    const snapshot = await getDocs(q);
    return snapshot.size;
  }
}
