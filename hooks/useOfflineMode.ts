import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineQueueItem {
  id: string;
  type: 'progress' | 'completion' | 'analytics' | 'profile';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineModeState {
  isOnline: boolean;
  isConnected: boolean;
  queueSize: number;
  lastSyncTime: number | null;
  syncInProgress: boolean;
}

interface UseOfflineModeReturn extends OfflineModeState {
  queueAction: (type: OfflineQueueItem['type'], data: any) => Promise<void>;
  syncWhenOnline: () => Promise<void>;
  clearQueue: () => Promise<void>;
  getQueuedActions: () => Promise<OfflineQueueItem[]>;
}

const OFFLINE_QUEUE_KEY = 'hindi_learning_offline_queue';
const LAST_SYNC_KEY = 'hindi_learning_last_sync';

export function useOfflineMode(): UseOfflineModeReturn {
  const [state, setState] = useState<OfflineModeState>({
    isOnline: true,
    isConnected: true,
    queueSize: 0,
    lastSyncTime: null,
    syncInProgress: false,
  });

  useEffect(() => {
    // Load initial sync time
    loadLastSyncTime();
    
    // Load queue size
    updateQueueSize();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isConnected = netState.isConnected && netState.isInternetReachable !== false;
      const wasOffline = !state.isOnline;
      
      setState(prev => ({
        ...prev,
        isOnline: isConnected,
        isConnected,
      }));

      // Auto-sync when coming back online
      if (wasOffline && isConnected && state.queueSize > 0) {
        setTimeout(() => {
          syncWhenOnline();
        }, 1000); // Small delay to ensure stable connection
      }
    });

    return unsubscribe;
  }, []);

  const loadLastSyncTime = async () => {
    try {
      const stored = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (stored) {
        setState(prev => ({ ...prev, lastSyncTime: parseInt(stored) }));
      }
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const updateLastSyncTime = async () => {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
      setState(prev => ({ ...prev, lastSyncTime: now }));
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  };

  const updateQueueSize = async () => {
    try {
      const queue = await getQueuedActions();
      setState(prev => ({ ...prev, queueSize: queue.length }));
    } catch (error) {
      console.error('Error updating queue size:', error);
    }
  };

  const queueAction = useCallback(async (
    type: OfflineQueueItem['type'],
    data: any
  ): Promise<void> => {
    try {
      const item: OfflineQueueItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      const queue = await getQueuedActions();
      queue.push(item);
      
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      setState(prev => ({ ...prev, queueSize: queue.length }));

      // Try to sync immediately if online
      if (state.isOnline && !state.syncInProgress) {
        setTimeout(syncWhenOnline, 0);
      }
    } catch (error) {
      console.error('Error queueing offline action:', error);
    }
  }, [state.isOnline, state.syncInProgress]);

  const getQueuedActions = useCallback(async (): Promise<OfflineQueueItem[]> => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting queued actions:', error);
      return [];
    }
  }, []);

  const processQueueItem = async (item: OfflineQueueItem): Promise<boolean> => {
    try {
      // Simulate API calls for different action types
      switch (item.type) {
        case 'progress':
          // await syncProgressToServer(item.data);
          console.log('Syncing progress:', item.data);
          break;
        case 'completion':
          // await syncCompletionToServer(item.data);
          console.log('Syncing completion:', item.data);
          break;
        case 'analytics':
          // await syncAnalyticsToServer(item.data);
          console.log('Syncing analytics:', item.data);
          break;
        case 'profile':
          // await syncProfileToServer(item.data);
          console.log('Syncing profile:', item.data);
          break;
        default:
          console.warn('Unknown queue item type:', item.type);
          return true; // Remove unknown types
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true; // Success
    } catch (error) {
      console.error('Error processing queue item:', error);
      return false; // Failed
    }
  };

  const syncWhenOnline = useCallback(async (): Promise<void> => {
    if (!state.isOnline || state.syncInProgress) {
      return;
    }

    setState(prev => ({ ...prev, syncInProgress: true }));

    try {
      const queue = await getQueuedActions();
      if (queue.length === 0) {
        return;
      }

      console.log(`Starting sync of ${queue.length} items...`);
      
      const remainingItems: OfflineQueueItem[] = [];
      let syncedCount = 0;

      for (const item of queue) {
        const success = await processQueueItem(item);
        
        if (success) {
          syncedCount++;
        } else {
          // Increment retry count and keep if under max retries
          item.retryCount++;
          if (item.retryCount < item.maxRetries) {
            remainingItems.push(item);
          } else {
            console.warn(`Max retries exceeded for item: ${item.id}`);
          }
        }
      }

      // Update the queue with remaining items
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingItems));
      setState(prev => ({ ...prev, queueSize: remainingItems.length }));

      if (syncedCount > 0) {
        await updateLastSyncTime();
        console.log(`Successfully synced ${syncedCount} items`);
      }

    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setState(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [state.isOnline, state.syncInProgress]);

  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      setState(prev => ({ ...prev, queueSize: 0 }));
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }, []);

  return {
    ...state,
    queueAction,
    syncWhenOnline,
    clearQueue,
    getQueuedActions,
  };
}

// Hook for offline-first data management
export function useOfflineData<T>(
  key: string,
  initialData: T
): [T, (data: T) => Promise<void>, boolean] {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: T) => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Error saving offline data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return [data, saveData, isLoading];
}