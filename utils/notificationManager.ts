import { RewardNotification } from './questManager';

type NotificationCallback = (
  type: 'xp' | 'badge' | 'quest' | 'levelup',
  title: string,
  description: string,
  xpAmount?: number,
  iconName?: string,
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
) => void;

class NotificationManager {
  private static instance: NotificationManager;
  private callback: NotificationCallback | null = null;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  setCallback(callback: NotificationCallback) {
    this.callback = callback;
  }

  showNotification(
    type: 'xp' | 'badge' | 'quest' | 'levelup',
    title: string,
    description: string,
    xpAmount?: number,
    iconName?: string,
    rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  ) {
    if (this.callback) {
      this.callback(type, title, description, xpAmount, iconName, rarity);
    } else {
      // Fallback to console log if no callback is set
      console.log(`🎉 ${title}: ${description} ${xpAmount ? `(+${xpAmount} XP)` : ''}`);
    }
  }

  showXPGain(amount: number, reason: string) {
    this.showNotification(
      'xp',
      `+${amount} XP`,
      reason,
      amount,
      'flash'
    );
  }

  showBadgeUnlocked(name: string, description: string, xp: number, rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common') {
    this.showNotification(
      'badge',
      '🏆 Badge Unlocked!',
      `${name}: ${description}`,
      xp,
      'trophy',
      rarity
    );
  }

  showQuestCompleted(name: string, description: string, xp: number) {
    this.showNotification(
      'quest',
      '✅ Quest Complete!',
      `${name}: ${description}`,
      xp,
      'checkmark-circle'
    );
  }

  showLevelUp(newLevel: number) {
    this.showNotification(
      'levelup',
      '🚀 Level Up!',
      `Congratulations! You've reached level ${newLevel}`,
      0,
      'rocket'
    );
  }
}

export const notificationManager = NotificationManager.getInstance();