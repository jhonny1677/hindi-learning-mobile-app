import React from 'react';
import { databaseService } from '../database/database';

class AnalyticsManager {
  private listeners: ((analytics: any) => void)[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;

  public addListener(listener: (analytics: any) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (analytics: any) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public async refreshAnalytics() {
    try {
      const analytics = await databaseService.getLearningAnalytics();
      this.listeners.forEach(listener => listener(analytics));
      return analytics;
    } catch (error) {
      console.warn('Failed to refresh analytics:', error);
      return null;
    }
  }

  public async triggerAnalyticsUpdate() {
    // Refresh immediately
    await this.refreshAnalytics();
    
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Set a debounced refresh for 1 second later
    this.refreshTimer = setTimeout(() => {
      this.refreshAnalytics();
    }, 1000);
  }

  public startPeriodicRefresh(intervalMs: number = 30000) {
    setInterval(() => {
      this.refreshAnalytics();
    }, intervalMs);
  }
}

export const analyticsManager = new AnalyticsManager();

export const useRealTimeAnalytics = () => {
  const [analytics, setAnalytics] = React.useState(null);

  React.useEffect(() => {
    const listener = (data: any) => setAnalytics(data);
    analyticsManager.addListener(listener);
    
    // Initial load
    analyticsManager.refreshAnalytics();
    
    return () => analyticsManager.removeListener(listener);
  }, []);

  return analytics;
};