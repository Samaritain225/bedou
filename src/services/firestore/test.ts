import { transactionsService } from '@/src/services/firestore';

/**
 * Test Firestore Connection
 * Creates a test transaction to verify Firestore is working
 */
export const testFirestoreConnection = async (userId: string = 'test-user') => {
  try {
    console.log('🧪 Testing Firestore connection...');

    // Create a test transaction
    const testTransaction = {
      userId,
      dateISO: new Date().toISOString(),
      amountOriginal: 1000,
      currencyCode: 'XOF',
      amountBase: 1000,
      type: 'expense' as const,
      note: 'Firestore connection test',
      tags: ['test'],
    };

    const transactionId = await transactionsService.create(testTransaction);
    console.log('✅ Firestore connection successful!');
    console.log('📝 Created test transaction with ID:', transactionId);

    // Verify we can read it back
    const retrieved = await transactionsService.getById(transactionId);
    console.log('📖 Retrieved transaction:', retrieved);

    // Clean up - delete the test transaction
    await transactionsService.hardDelete(transactionId);
    console.log('🧹 Cleaned up test transaction');

    return {
      success: true,
      transactionId,
    };
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return {
      success: false,
      error,
    };
  }
};

/**
 * Get Firestore statistics
 */
export const getFirestoreStats = async (userId: string) => {
  try {
    const transactions = await transactionsService.getAll([['userId', '==', userId]]);

    console.log('📊 Firestore Statistics:');
    console.log(`  - Transactions: ${transactions.length}`);

    return {
      transactions: transactions.length,
    };
  } catch (error) {
    console.error('❌ Error getting Firestore stats:', error);
    return null;
  }
};
