import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider, onlineManager, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAppContext } from '../contexts/AppContext';
import { useSyncMutation } from '../hooks/useQuery';

// Create a client with offline-first configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries 3 times
      retry: 3,
      // Consider data stale after 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Enable background refetch when window refocuses
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Retry with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network mode for offline-first
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 2,
      networkMode: 'offlineFirst',
    },
  },
});

// Offline sync component
const OfflineSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsOffline } = useAppContext();
  const syncMutation = useSyncMutation();

  useEffect(() => {
    // Setup network state monitoring
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOffline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(isOffline);
      onlineManager.setOnline(!isOffline);

      // Auto-sync when coming back online
      if (!isOffline && onlineManager.isOnline()) {
        syncMutation.mutate();
      }
    });

    // Setup app state monitoring for background sync
    const handleAppStateChange = (nextAppState: string) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(nextAppState === 'active');
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      appStateSubscription?.remove();
    };
  }, []); // Empty dependency array - only run once on mount

  // Periodic sync every 5 minutes when online
  useEffect(() => {
    const interval = setInterval(() => {
      if (onlineManager.isOnline() && !syncMutation.isPending) {
        syncMutation.mutate();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  return <>{children}</>;
};

// Enhanced Query Provider with offline capabilities
const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineSync>
        {children}
      </OfflineSync>
    </QueryClientProvider>
  );
};

export default QueryProvider;
export { queryClient };