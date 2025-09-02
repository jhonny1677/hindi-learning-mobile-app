import { Platform } from 'react-native';

// Web-compatible haptic feedback service
class HapticService {
  // Impact feedback styles
  static ImpactFeedbackStyle = {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  };
  
  // Notification feedback types
  static NotificationFeedbackType = {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  };
  
  static async impactAsync(style: string = 'medium'): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback - use vibration API if available
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        const vibrationPattern = {
          light: [10],
          medium: [20],
          heavy: [40],
        };
        navigator.vibrate(vibrationPattern[style as keyof typeof vibrationPattern] || [20]);
      }
      console.log(`Haptic feedback: ${style} impact`);
    }
  }
  
  static async notificationAsync(type: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        const vibrationPattern = {
          success: [50, 50, 50],
          warning: [100, 50, 100],
          error: [200],
        };
        navigator.vibrate(vibrationPattern[type as keyof typeof vibrationPattern] || [50]);
      }
      console.log(`Haptic notification: ${type}`);
    }
  }
  
  static async selectionAsync(): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([5]);
      }
      console.log('Haptic selection feedback');
    }
  }
}

// Export with same interface as expo-haptics
export const impactAsync = HapticService.impactAsync;
export const notificationAsync = HapticService.notificationAsync;
export const selectionAsync = HapticService.selectionAsync;
export const ImpactFeedbackStyle = HapticService.ImpactFeedbackStyle;
export const NotificationFeedbackType = HapticService.NotificationFeedbackType;