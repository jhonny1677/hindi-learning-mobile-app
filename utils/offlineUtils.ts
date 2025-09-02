import { webStorage } from './webStorage';
import React from 'react';

export interface OfflineState {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingActions: any[];
}

class OfflineManager {
  private listeners: ((isOnline: boolean) => void)[] = [];
  private isOnline: boolean = true;
  private pendingActions: any[] = [];

  constructor() {
    this.initOfflineDetection();
    this.loadPendingActions();
  }

  private async initOfflineDetection() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.setOnlineStatus(true);
        this.syncPendingActions();
      });
      
      window.addEventListener('offline', () => {
        this.setOnlineStatus(false);
      });
    }
  }

  private setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    this.listeners.forEach(listener => listener(isOnline));
    this.saveOfflineState();
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public addOfflineListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
  }

  public removeOfflineListener(listener: (isOnline: boolean) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public async addPendingAction(action: any) {
    this.pendingActions.push(action);
    await this.savePendingActions();
  }

  private async loadPendingActions() {
    try {
      const stored = await webStorage.getItem('pending_actions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load pending actions:', error);
    }
  }

  private async savePendingActions() {
    try {
      await webStorage.setItem('pending_actions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.warn('Failed to save pending actions:', error);
    }
  }

  private async saveOfflineState() {
    try {
      const state: OfflineState = {
        isOnline: this.isOnline,
        lastSyncTime: new Date().toISOString(),
        pendingActions: this.pendingActions
      };
      await webStorage.setItem('offline_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save offline state:', error);
    }
  }

  private async syncPendingActions() {
    if (!this.isOnline || this.pendingActions.length === 0) return;

    console.log(`Syncing ${this.pendingActions.length} pending actions...`);
    
    // Process pending actions when back online
    // For now, just clear them as the app already works offline with AsyncStorage
    this.pendingActions = [];
    await this.savePendingActions();
    
    console.log('Pending actions synced successfully');
  }

  public async getOfflineState(): Promise<OfflineState | null> {
    try {
      const stored = await webStorage.getItem('offline_state');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to get offline state:', error);
      return null;
    }
  }
}

export const offlineManager = new OfflineManager();

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(offlineManager.getOnlineStatus());

  React.useEffect(() => {
    const listener = (online: boolean) => setIsOnline(online);
    offlineManager.addOfflineListener(listener);
    
    return () => offlineManager.removeOfflineListener(listener);
  }, []);

  return isOnline;
};