import { useNetworkState } from '@/src/hooks/firestore';
import { getFirestoreStats, testFirestoreConnection } from '@/src/services/firestore/test';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Firestore Test Screen
 * Add this temporarily to test Firestore connection
 * 
 * Usage: Import and render this component in any screen
 */
export function FirestoreTestPanel() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const isOnline = useNetworkState();

  const runTest = async () => {
    setLoading(true);
    setResult('Running test...');
    
    const testResult = await testFirestoreConnection();
    
    if (testResult.success) {
      setResult(`✅ SUCCESS!\nTransaction ID: ${testResult.transactionId}\n\nCheck logs for details.`);
    } else {
      setResult(`❌ FAILED!\n${testResult.error}\n\nCheck logs for details.`);
    }
    
    setLoading(false);
  };

  const checkStats = async () => {
    setLoading(true);
    setResult('Checking stats...');
    
    const stats = await getFirestoreStats('test-user');
    
    if (stats) {
      setResult(`📊 Firestore Stats:\n- Transactions: ${stats.transactions}`);
    } else {
      setResult('❌ Failed to get stats');
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Firestore Test Panel</Text>
        <Text style={[styles.status, isOnline ? styles.online : styles.offline]}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </Text>
      </View>

      <ScrollView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={runTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={checkStats}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Check Stats</Text>
        </TouchableOpacity>
      </ScrollView>

      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  online: {
    color: '#4CAF50',
  },
  offline: {
    color: '#F44336',
  },
  buttonContainer: {
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
