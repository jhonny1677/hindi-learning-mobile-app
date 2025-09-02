import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineMode } from '../hooks/useOfflineMode';

interface OfflineIndicatorProps {
  onSyncPress?: () => void;
}

export default function OfflineIndicator({ onSyncPress }: OfflineIndicatorProps) {
  const { isOnline, queueSize, syncInProgress, lastSyncTime, syncWhenOnline } = useOfflineMode();
  const [fadeAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    // Animate when going offline/online
    Animated.timing(fadeAnim, {
      toValue: isOnline ? 0.8 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  const handleSyncPress = () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      syncWhenOnline();
    }
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    
    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Don't show if online and no queued items
  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[
        styles.indicator,
        isOnline ? styles.onlineIndicator : styles.offlineIndicator
      ]}>
        <View style={styles.statusSection}>
          <Ionicons 
            name={isOnline ? 'cloud-done' : 'cloud-offline'} 
            size={20} 
            color={isOnline ? '#10B981' : '#EF4444'} 
          />
          <View style={styles.statusText}>
            <Text style={[
              styles.statusTitle,
              { color: isOnline ? '#10B981' : '#EF4444' }
            ]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isOnline 
                ? queueSize > 0 
                  ? `${queueSize} items to sync`
                  : `Last sync: ${getLastSyncText()}`
                : 'Changes saved locally'
              }
            </Text>
          </View>
        </View>

        {queueSize > 0 && (
          <TouchableOpacity 
            style={styles.syncButton} 
            onPress={handleSyncPress}
            disabled={syncInProgress || !isOnline}
          >
            {syncInProgress ? (
              <Ionicons name="refresh" size={18} color="#4F46E5" />
            ) : (
              <Ionicons name="sync" size={18} color="#4F46E5" />
            )}
            <Text style={styles.syncText}>
              {syncInProgress ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 60, // Account for status bar
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  onlineIndicator: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  offlineIndicator: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 4,
  },
});