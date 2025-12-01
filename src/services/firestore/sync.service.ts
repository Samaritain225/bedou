import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';

/**
 * Sync Service
 * Manages offline/online state and data synchronization
 */
class SyncService {
  private isOnline = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private unsubscribeNetInfo?: () => void;

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener() {
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      console.log(`📡 Network state: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));

      // When coming back online, Firestore automatically syncs pending writes
      if (wasOffline && this.isOnline) {
        console.log('🔄 Back online - Firestore will sync pending changes');
        this.onBackOnline();
      }
    });
  }

  /**
   * Handle back online event
   */
  private async onBackOnline() {
    try {
      // Wait for pending writes to complete
      await this.waitForPendingWrites();
      console.log('✅ Pending writes synced successfully');
    } catch (error) {
      console.error('❌ Error syncing pending writes:', error);
    }
  }

  /**
   * Subscribe to network state changes
   */
  onNetworkStateChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.isOnline);

    return () => this.listeners.delete(callback);
  }

  /**
   * Check if device is online
   */
  getNetworkState(): boolean {
    return this.isOnline;
  }

  /**
   * Enable/disable Firestore network
   */
  async enableNetwork(enable: boolean): Promise<void> {
    try {
      if (enable) {
        await firestore().enableNetwork();
        console.log('✅ Firestore network enabled');
      } else {
        await firestore().disableNetwork();
        console.log('⏸️ Firestore network disabled');
      }
    } catch (error) {
      console.error('❌ Error toggling Firestore network:', error);
      throw error;
    }
  }

  /**
   * Wait for pending writes to sync
   */
  async waitForPendingWrites(): Promise<void> {
    try {
      await firestore().waitForPendingWrites();
    } catch (error) {
      console.error('❌ Error waiting for pending writes:', error);
      throw error;
    }
  }

  /**
   * Clear Firestore cache (useful for debugging)
   */
  async clearCache(): Promise<void> {
    try {
      await firestore().clearPersistence();
      console.log('✅ Firestore cache cleared');
    } catch (error) {
      console.error('❌ Error clearing Firestore cache:', error);
      throw error;
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    this.unsubscribeNetInfo?.();
    this.listeners.clear();
  }
}

export const syncService = new SyncService();
