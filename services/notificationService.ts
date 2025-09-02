import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface StudyReminderSettings {
  enabled: boolean;
  times: string[]; // Array of times in 'HH:mm' format
  days: number[]; // Array of day numbers (0 = Sunday, 6 = Saturday)
  message: string;
}

class NotificationService {
  private isInitialized = false;
  
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      // Web-compatible initialization
      // console.log('Notification service initialized (web-compatible mode)');
      this.isInitialized = true;
      return true;
    } catch (error) {
      // console.error('Error initializing notifications:', error);
      return false;
    }
  }
  
  async scheduleStudyReminders(settings: StudyReminderSettings): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }
    
    // console.log('Scheduling study reminders:', settings);
    await AsyncStorage.setItem('study-reminders', JSON.stringify(settings));
    
    // For web, we could implement browser notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    }
  }
  
  async cancelStudyReminders(): Promise<void> {
    // console.log('Cancelling study reminders');
    await AsyncStorage.removeItem('study-reminders');
  }
  
  async scheduleStreakReminder(): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }
    
    // console.log('Scheduling streak reminder for tomorrow');
  }
  
  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }
    
    // console.log(`Notification: ${title} - ${body}`);
    
    // Web browser notification fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }
  
  async getScheduledReminders(): Promise<any[]> {
    return []; // Return empty array for web compatibility
  }
  
  async getSavedSettings(): Promise<StudyReminderSettings | null> {
    try {
      const settings = await AsyncStorage.getItem('study-reminders');
      return settings ? JSON.parse(settings) : null;
    } catch {
      return null;
    }
  }
  
  // Celebration notifications
  async sendCelebrationNotification(achievement: string): Promise<void> {
    const celebrations = {
      'level-completed': {
        title: '🎉 Level Complete!',
        body: `Congratulations! You've mastered the ${achievement} level!`,
      },
      'streak-milestone': {
        title: '🔥 Streak Milestone!',
        body: `Amazing! You've maintained a ${achievement}-day learning streak!`,
      },
      'daily-goal': {
        title: '✅ Daily Goal Achieved!',
        body: 'Great work! You\'ve completed your daily Hindi practice.',
      },
      'perfect-score': {
        title: '💯 Perfect Score!',
        body: 'Outstanding! You got every word right in this session.',
      },
    };
    
    const celebration = celebrations[achievement as keyof typeof celebrations];
    if (celebration) {
      await this.sendImmediateNotification(celebration.title, celebration.body, {
        type: 'celebration',
        achievement,
      });
    }
  }
}

export const notificationService = new NotificationService();

// Utility functions for common notification scenarios
export const scheduleDefaultStudyReminders = async () => {
  const defaultSettings: StudyReminderSettings = {
    enabled: true,
    times: ['09:00', '18:00'], // 9 AM and 6 PM
    days: [1, 2, 3, 4, 5], // Monday to Friday
    message: '📚 Time for your daily Hindi practice! 🌟',
  };
  
  await notificationService.scheduleStudyReminders(defaultSettings);
};

export const handleNotificationResponse = (response: any) => {
  // console.log('Notification response handled:', response);
};