import { BaseFirestoreService, OrderByClause, WhereClause } from '@/src/services/firestore/base.service';
import { useEffect, useState } from 'react';

/**
 * Custom hook for Firestore real-time collection data
 */
export function useFirestoreCollection<T extends { id?: string }>(
  service: BaseFirestoreService<T>,
  where?: WhereClause[],
  orderBy?: OrderByClause[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = service.onSnapshot(
      (newData) => {
        setData(newData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      where,
      orderBy
    );

    return unsubscribe;
  }, [service, JSON.stringify(where), JSON.stringify(orderBy)]);

  return { data, loading, error };
}

/**
 * Custom hook for a single Firestore document
 */
export function useFirestoreDocument<T extends { id?: string }>(
  service: BaseFirestoreService<T>,
  documentId: string | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = service.onDocumentSnapshot(
      documentId,
      (newData) => {
        setData(newData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [service, documentId]);

  return { data, loading, error };
}
