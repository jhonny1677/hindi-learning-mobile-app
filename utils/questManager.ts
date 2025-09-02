import { webStorage } from './webStorage';
import { Quest, Badge, UserXP } from '../components/QuestsAndBadges';
import { notificationManager } from './notificationManager';

const QUESTS_STORAGE_KEY = 'hindi_learning_quests';
const BADGES_STORAGE_KEY = 'hindi_learning_badges';
const XP_STORAGE_KEY = 'hindi_learning_xp';
const DAILY_STATS_KEY = 'hindi_learning_daily_stats';

export interface DailyStats {
  date: string;
  wordsLearned: number;
  studyTimeMinutes: number;
  streak: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface RewardNotification {
  type: 'xp' | 'badge' | 'quest' | 'levelup';
  title: string;
  description: string;
  xpAmount?: number;
  iconName?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

class QuestManager {
  private static instance: QuestManager;

  static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  async trackWordLearned(): Promise<{ xpGained: number; questsCompleted: string[]; badgesUnlocked: string[]; notifications: RewardNotification[] }> {
    const results = {
      xpGained: 0,
      questsCompleted: [] as string[],
      badgesUnlocked: [] as string[],
      notifications: [] as RewardNotification[]
    };

    // Update daily stats
    await this.updateDailyStats('wordsLearned', 1);

    // Update quests
    const questResults = await this.updateQuestProgress('progress', 1);
    results.xpGained += questResults.xpGained;
    results.questsCompleted.push(...questResults.questsCompleted);

    // Check for badges
    const badgeResults = await this.checkBadges();
    results.badgesUnlocked.push(...badgeResults);

    return results;
  }

  async trackCorrectAnswer(): Promise<{ xpGained: number; questsCompleted: string[]; badgesUnlocked: string[] }> {
    const results = {
      xpGained: 10, // Base XP for correct answer
      questsCompleted: [] as string[],
      badgesUnlocked: [] as string[]
    };

    // Update daily stats
    await this.updateDailyStats('correctAnswers', 1);
    await this.updateDailyStats('totalAnswers', 1);

    // Add XP
    await this.addXP(results.xpGained, 'Correct Answer', 'Answered a question correctly');

    return results;
  }

  async trackStudyTime(minutes: number): Promise<{ xpGained: number; questsCompleted: string[]; badgesUnlocked: string[] }> {
    const results = {
      xpGained: 0,
      questsCompleted: [] as string[],
      badgesUnlocked: [] as string[]
    };

    // Update daily stats
    await this.updateDailyStats('studyTimeMinutes', minutes);

    // Update study time quests
    const questResults = await this.updateQuestProgress('study', minutes);
    results.xpGained += questResults.xpGained;
    results.questsCompleted.push(...questResults.questsCompleted);

    return results;
  }

  async trackStreak(streakCount: number): Promise<{ xpGained: number; questsCompleted: string[]; badgesUnlocked: string[] }> {
    const results = {
      xpGained: 0,
      questsCompleted: [] as string[],
      badgesUnlocked: [] as string[]
    };

    // Update daily stats
    await this.updateDailyStats('streak', streakCount);

    // Update streak quests
    const questResults = await this.updateQuestProgress('streak', 1);
    results.xpGained += questResults.xpGained;
    results.questsCompleted.push(...questResults.questsCompleted);

    return results;
  }

  private async updateDailyStats(stat: keyof Omit<DailyStats, 'date'>, value: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsData = await webStorage.getItem(DAILY_STATS_KEY);
      let dailyStats: DailyStats = statsData ? JSON.parse(statsData) : {
        date: today,
        wordsLearned: 0,
        studyTimeMinutes: 0,
        streak: 0,
        correctAnswers: 0,
        totalAnswers: 0
      };

      console.log('📈 Updating daily stats - before:', JSON.stringify(dailyStats));
      console.log('📈 Updating stat:', stat, 'with value:', value);

      // Reset if it's a new day
      if (dailyStats.date !== today) {
        dailyStats = {
          date: today,
          wordsLearned: 0,
          studyTimeMinutes: 0,
          streak: 0,
          correctAnswers: 0,
          totalAnswers: 0
        };
      }

      // Update the specific stat
      dailyStats[stat] = (dailyStats[stat] || 0) + value;

      console.log('📈 Updated daily stats - after:', JSON.stringify(dailyStats));
      await webStorage.setItem(DAILY_STATS_KEY, JSON.stringify(dailyStats));
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }

  private async updateQuestProgress(category: string, progress: number): Promise<{ xpGained: number; questsCompleted: string[] }> {
    try {
      const questsData = await webStorage.getItem(QUESTS_STORAGE_KEY);
      const quests: Quest[] = questsData ? JSON.parse(questsData) : [];

      let xpGained = 0;
      const questsCompleted: string[] = [];

      for (const quest of quests) {
        if (quest.category === category && !quest.isCompleted) {
          quest.progress = Math.min(quest.progress + progress, quest.target);
          
          if (quest.progress >= quest.target && !quest.isCompleted) {
            quest.isCompleted = true;
            quest.completedAt = new Date().toISOString();
            xpGained += quest.xpReward;
            questsCompleted.push(quest.title);

            // Add XP
            await this.addXP(quest.xpReward, 'Quest Complete', `Completed quest: ${quest.title}`);
            
            // Show notification
            notificationManager.showQuestCompleted(quest.title, quest.description, quest.xpReward);
          }
        }
      }

      await webStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(quests));

      return { xpGained, questsCompleted };
    } catch (error) {
      console.error('Error updating quest progress:', error);
      return { xpGained: 0, questsCompleted: [] };
    }
  }

  private async checkBadges(): Promise<string[]> {
    try {
      const badgesData = await webStorage.getItem(BADGES_STORAGE_KEY);
      let badges: Badge[] = badgesData ? JSON.parse(badgesData) : [];
      
      console.log('🏆 Checking badges...', badges.length === 0 ? 'No badges found, initializing' : `Found ${badges.length} badges`);
      
      // Initialize badges if they don't exist
      if (badges.length === 0) {
        badges = [
          {
            id: 'first_word',
            name: 'First Steps',
            description: 'Learned your first Hindi word',
            icon: 'star' as any,
            rarity: 'common',
            requirements: 'Learn 1 word',
            xpValue: 25,
          },
          {
            id: 'fast_learner',
            name: 'Fast Learner',
            description: 'Learned 10 words in a day',
            icon: 'flash' as any,
            rarity: 'rare',
            requirements: 'Learn 10 words',
            xpValue: 100,
          },
          {
            id: 'accuracy_master',
            name: 'Accuracy Master',
            description: 'Achieved 90% accuracy',
            icon: 'trophy' as any,
            rarity: 'epic',
            requirements: '90% accuracy with 10+ answers',
            xpValue: 200,
          },
          {
            id: 'streak_starter',
            name: 'Streak Starter',
            description: 'Maintained a 3-day streak',
            icon: 'flame' as any,
            rarity: 'common',
            requirements: '3-day streak',
            xpValue: 50,
          },
          {
            id: 'dedicated_learner',
            name: 'Dedicated Learner',
            description: 'Studied for 30 minutes',
            icon: 'book' as any,
            rarity: 'rare',
            requirements: '30 minutes study time',
            xpValue: 75,
          }
        ];
        await webStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(badges));
      }
      
      const dailyStatsData = await webStorage.getItem(DAILY_STATS_KEY);
      const dailyStats: DailyStats = dailyStatsData ? JSON.parse(dailyStatsData) : null;

      const unlockedBadges: string[] = [];

      if (!dailyStats) {
        console.log('🏆 No daily stats found, skipping badge check');
        return unlockedBadges;
      }
      
      console.log('🏆 Daily stats:', dailyStats);

      for (const badge of badges) {
        if (badge.unlockedAt) continue; // Already unlocked

        let shouldUnlock = false;

        // Check badge requirements based on TOTAL progress, not just daily
        const userXPData = await webStorage.getItem(XP_STORAGE_KEY);
        const userLevel = userXPData ? JSON.parse(userXPData).level : 1;
        
        switch (badge.id) {
          case 'first_word':
            // Award this badge on the very first correct answer, not just daily stats
            shouldUnlock = dailyStats.wordsLearned >= 1 || dailyStats.correctAnswers >= 1;
            break;
          case 'fast_learner':
            shouldUnlock = dailyStats.wordsLearned >= 10;
            break;
          case 'accuracy_master':
            shouldUnlock = dailyStats.totalAnswers >= 10 && 
                          (dailyStats.correctAnswers / dailyStats.totalAnswers) >= 0.9;
            break;
          case 'streak_starter':
            shouldUnlock = dailyStats.streak >= 3;
            break;
          case 'dedicated_learner':
            shouldUnlock = dailyStats.studyTimeMinutes >= 30;
            break;
          // Remove hindi_scholar from auto-awarding - it should be earned through actual progress
          default:
            shouldUnlock = false;
            break;
        }

        if (shouldUnlock) {
          console.log('🏆 Unlocking badge:', badge.name);
          badge.unlockedAt = new Date().toISOString();
          unlockedBadges.push(badge.name);

          // Add XP for badge
          await this.addXP(badge.xpValue, 'Badge Earned', `Earned badge: ${badge.name}`);
          
          // Show notification
          console.log('🏆 Showing badge notification:', badge.name);
          notificationManager.showBadgeUnlocked(badge.name, badge.description, badge.xpValue, badge.rarity);
        }
      }

      await webStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(badges));

      return unlockedBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  private async addXP(amount: number, source: string, description: string): Promise<void> {
    try {
      const xpData = await webStorage.getItem(XP_STORAGE_KEY);
      let userXP: UserXP = xpData ? JSON.parse(xpData) : {
        totalXP: 0,
        level: 1,
        currentLevelXP: 0,
        nextLevelXP: 100,
        xpHistory: []
      };

      userXP.totalXP += amount;
      userXP.currentLevelXP += amount;

      // Check for level up
      while (userXP.currentLevelXP >= userXP.nextLevelXP) {
        userXP.currentLevelXP -= userXP.nextLevelXP;
        userXP.level++;
        userXP.nextLevelXP = userXP.level * 100; // Each level requires more XP

        // Add level up to history
        userXP.xpHistory.push({
          date: new Date().toISOString(),
          xp: 0,
          source: 'Level Up',
          description: `Reached level ${userXP.level}!`
        });
        
        // Show level up notification
        notificationManager.showLevelUp(userXP.level);
      }

      // Add XP gain to history
      userXP.xpHistory.push({
        date: new Date().toISOString(),
        xp: amount,
        source,
        description
      });

      // Keep only last 50 entries
      if (userXP.xpHistory.length > 50) {
        userXP.xpHistory = userXP.xpHistory.slice(-50);
      }

      await webStorage.setItem(XP_STORAGE_KEY, JSON.stringify(userXP));
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }

  async getUserLevel(): Promise<number> {
    try {
      const xpData = await webStorage.getItem(XP_STORAGE_KEY);
      if (!xpData) return 1;
      const userXP: UserXP = JSON.parse(xpData);
      return userXP.level;
    } catch (error) {
      console.error('Error getting user level:', error);
      return 1;
    }
  }

  async getUserXP(): Promise<number> {
    try {
      const xpData = await webStorage.getItem(XP_STORAGE_KEY);
      if (!xpData) return 0;
      const userXP: UserXP = JSON.parse(xpData);
      return userXP.totalXP;
    } catch (error) {
      console.error('Error getting user XP:', error);
      return 0;
    }
  }
}

export const questManager = QuestManager.getInstance();