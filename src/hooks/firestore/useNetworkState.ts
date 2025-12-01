import { syncService } from '@/src/services/firestore/sync.service';
import { useEffect, useState } from 'react';

/**
 * Custom hook to monitor network connectivity
 */
export function useNetworkState() {
  const [isOnline, setIsOnline] = useState(syncService.getNetworkState());

  useEffect(() => {
    const unsubscribe = syncService.onNetworkStateChange((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return isOnline;
}
