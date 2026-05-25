import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const PERMISSION_ASKED_KEY = 'notifications_permission_asked';
const REMINDER_SCHEDULED_KEY = 'daily_reminder_scheduled';

// How notifications look when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (Platform.OS === 'web') {
      this.isInitialized = true;
      return true;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      this.isInitialized = true;
      return status === 'granted';
    } catch {
      this.isInitialized = true;
      return false;
    }
  }

  // Call this on first app launch (after onboarding)
  async requestPermissionIfNeeded(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const alreadyAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
      if (alreadyAsked) {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
      }

      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
      return status === 'granted';
    } catch {
      return false;
    }
  }

  // Schedule a daily 8pm reminder to practice
  async scheduleDailyReminder(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const granted = await this.requestPermissionIfNeeded();
      if (!granted) return;

      const alreadyScheduled = await AsyncStorage.getItem(REMINDER_SCHEDULED_KEY);
      if (alreadyScheduled) return;

      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to practice Hindi! 🙏',
          body: 'Keep your streak alive — just 5 minutes a day makes a big difference.',
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });

      await AsyncStorage.setItem(REMINDER_SCHEDULED_KEY, 'true');
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
    }
  }

  async cancelDailyReminder(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(REMINDER_SCHEDULED_KEY);
    } catch {}
  }

  async sendImmediateNotification(title: string, body: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: false },
        trigger: null, // fires immediately
      });
    } catch {}
  }

  async sendCelebrationNotification(achievement: string): Promise<void> {
    const map: Record<string, { title: string; body: string }> = {
      'level-completed': {
        title: '🎉 Level Complete!',
        body: `You've mastered the ${achievement} level!`,
      },
      'streak-milestone': {
        title: '🔥 Streak Milestone!',
        body: `Amazing! You've kept a ${achievement}-day learning streak!`,
      },
      'daily-goal': {
        title: '✅ Daily Goal Done!',
        body: "Great work! You've completed today's Hindi practice.",
      },
      'perfect-score': {
        title: '💯 Perfect Score!',
        body: 'Outstanding! You got every word right!',
      },
    };

    const c = map[achievement];
    if (c) await this.sendImmediateNotification(c.title, c.body);
  }

  // Legacy stubs kept for backward compatibility
  async scheduleStudyReminders(): Promise<void> {
    await this.scheduleDailyReminder();
  }

  async cancelStudyReminders(): Promise<void> {
    await this.cancelDailyReminder();
  }

  async scheduleStreakReminder(): Promise<void> {
    await this.scheduleDailyReminder();
  }
}

export const notificationService = new NotificationService();
export const scheduleDefaultStudyReminders = () => notificationService.scheduleDailyReminder();
export const handleNotificationResponse = (_response: unknown) => {};
