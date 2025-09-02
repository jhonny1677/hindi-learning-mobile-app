import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager, AppState } from 'react-native';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class PerformanceService {
  private memoryCache = new Map<string, any>();
  private maxMemoryCacheSize = 50; // Maximum number of items in memory cache
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  // Memory Cache Management
  setMemoryCache<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key) as CacheItem<T>;
    
    if (!item) return null;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
  
  // Persistent Cache Management
  async setPersistentCache<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to set persistent cache:', error);
    }
  }
  
  async getPersistentCache<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const cacheItem: CacheItem<T> = JSON.parse(item);
      
      // Check if item has expired
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get persistent cache:', error);
      return null;
    }
  }
  
  async clearPersistentCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }
  
  // Performance Optimization Utilities
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }
  
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastExecTime = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(null, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(null, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }
  
  // Run task after interactions are complete
  runAfterInteractions<T>(task: () => Promise<T> | T): Promise<T> {
    return new Promise((resolve, reject) => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  
  // Batch async operations
  async batchAsync<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 5
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      // Small delay between batches to prevent blocking
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }
  
  // Preload resources
  async preloadResources(resources: string[]): Promise<void> {
    // This would typically preload images, fonts, etc.
    // For now, we'll simulate with cache warming
    const preloadPromises = resources.map(async (resource) => {
      // Simulate resource loading
      await new Promise(resolve => setTimeout(resolve, 100));
      this.setMemoryCache(`preload_${resource}`, true, 30 * 60 * 1000); // 30 minutes
    });
    
    await Promise.all(preloadPromises);
  }
  
  // Memory management
  getMemoryUsage(): { used: number; total: number; percentage: number } {
    // This is a simplified implementation
    // In a real app, you might use native modules to get actual memory usage
    const used = this.memoryCache.size;
    const total = this.maxMemoryCacheSize;
    const percentage = (used / total) * 100;
    
    return { used, total, percentage };
  }
  
  // Clean up expired cache items
  cleanupCache(): void {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  // Background task management
  setupBackgroundTasks(): void {
    // Clean cache when app goes to background
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        this.cleanupCache();
      }
    });
    
    // Periodic cleanup
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  // Performance monitoring
  measurePerformance<T>(
    name: string,
    task: () => Promise<T> | T
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      
      try {
        const result = await task();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // console.log(`Performance: ${name} took ${duration}ms`);
        
        // Store performance metrics
        this.setMemoryCache(`perf_${name}`, {
          duration,
          timestamp: startTime,
        }, 60 * 60 * 1000); // 1 hour
        
        resolve(result);
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // console.error(`Performance: ${name} failed after ${duration}ms`, error);
        reject(error);
      }
    });
  }
  
  // Get performance metrics
  getPerformanceMetrics(): Array<{ name: string; duration: number; timestamp: number }> {
    const metrics: Array<{ name: string; duration: number; timestamp: number }> = [];
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (key.startsWith('perf_')) {
        const name = key.replace('perf_', '');
        metrics.push({
          name,
          duration: item.data.duration,
          timestamp: item.data.timestamp,
        });
      }
    }
    
    return metrics.sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const performanceService = new PerformanceService();

// Initialize background tasks
performanceService.setupBackgroundTasks();

// Utility hooks for React components
export const usePerformanceCache = <T>(
  key: string,
  fetcher: () => Promise<T> | T,
  ttl?: number
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try memory cache first
        const cached = performanceService.getMemoryCache<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return;
        }
        
        // Try persistent cache
        const persistentCached = await performanceService.getPersistentCache<T>(key);
        if (persistentCached !== null) {
          setData(persistentCached);
          performanceService.setMemoryCache(key, persistentCached, ttl);
          setLoading(false);
          return;
        }
        
        // Fetch fresh data
        const result = await fetcher();
        setData(result);
        performanceService.setMemoryCache(key, result, ttl);
        await performanceService.setPersistentCache(key, result, ttl);
        
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [key]);
  
  return { data, loading, error };
};

// Debounced input hook
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};