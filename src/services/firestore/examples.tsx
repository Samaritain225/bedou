import { useFirestoreCollection } from '@/src/hooks/firestore';
import { transactionsService } from '@/src/services/firestore';
import { TransactionDocument } from '@/src/types/firestore';
import { useEffect } from 'react';

/**
 * Example: Using Firestore services and hooks
 * This demonstrates how to use the Firestore integration
 */

// Example 1: Using service directly (manual queries)
const exampleUsingService = async (userId: string) => {
  try {
    // Create a transaction
    const transactionId = await transactionsService.create({
      userId,
      dateISO: new Date().toISOString(),
      amountOriginal: 5000,
      currencyCode: 'XOF',
      amountBase: 5000,
      type: 'expense',
      categoryId: 'some-category-id',
      note: 'Example transaction',
      tags: ['food', 'lunch'],
      paymentMethod: 'cash',
    });

    console.log('Created transaction:', transactionId);

    // Get transactions by date range
    const transactions = await transactionsService.getByDateRange(
      userId,
      '2025-12-01',
      '2025-12-31'
    );
    console.log('Transactions:', transactions);

    // Update a transaction
    await transactionsService.update(transactionId, {
      note: 'Updated note',
      amountOriginal: 6000,
      amountBase: 6000,
    });

    // Delete a transaction (soft delete)
    await transactionsService.delete(transactionId);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example 2: Using React hooks for real-time data
const TransactionsComponent = ({ userId }: { userId: string }) => {
  const { data: transactions, loading, error } = useFirestoreCollection<TransactionDocument>(
    transactionsService,
    [['userId', '==', userId]],
    [['dateISO', 'desc']]
  );

  useEffect(() => {
    if (!loading && !error) {
      console.log('Real-time transactions:', transactions);
    }
  }, [transactions, loading, error]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Transactions ({transactions.length})</h2>
      {transactions.map((tx) => (
        <div key={tx.id}>
          {tx.note} - {tx.amountBase} {tx.currencyCode}
        </div>
      ))}
    </div>
  );
};

// Example 3: Batch operations
const exampleBatchOperations = async (userId: string) => {
  await transactionsService.batchWrite([
    {
      type: 'create',
      data: {
        userId,
        dateISO: '2025-12-01',
        amountOriginal: 1000,
        currencyCode: 'XOF',
        amountBase: 1000,
        type: 'expense',
        note: 'Transaction 1',
      },
    },
    {
      type: 'create',
      data: {
        userId,
        dateISO: '2025-12-02',
        amountOriginal: 2000,
        currencyCode: 'XOF',
        amountBase: 2000,
        type: 'income',
        note: 'Transaction 2',
      },
    },
  ]);

  console.log('Batch created successfully');
};

export { exampleBatchOperations, exampleUsingService, TransactionsComponent };

