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
          { id: 'first_word',         name: 'First Steps',        description: 'Learned your first Hindi word',       icon: 'star' as any,         rarity: 'common',    requirements: 'Learn 1 word',                  xpValue: 25 },
          { id: 'word_warrior',       name: 'Word Warrior',       description: 'Learned 25 Hindi words',             icon: 'book' as any,         rarity: 'common',    requirements: 'Learn 25 words',                xpValue: 75 },
          { id: 'fast_learner',       name: 'Fast Learner',       description: 'Learned 10 words in one session',    icon: 'flash' as any,        rarity: 'rare',      requirements: 'Learn 10 words in a day',       xpValue: 100 },
          { id: 'century_club',       name: 'Century Club',       description: 'Reached 100 Hindi words learned',    icon: 'library' as any,      rarity: 'rare',      requirements: 'Learn 100 words',               xpValue: 200 },
          { id: 'double_century',     name: 'Word Master',        description: 'Conquered 200 Hindi words',          icon: 'medal' as any,        rarity: 'epic',      requirements: 'Learn 200 words',               xpValue: 400 },
          { id: 'accuracy_master',    name: 'Sharp Mind',         description: 'Achieved 90% accuracy',              icon: 'trophy' as any,       rarity: 'epic',      requirements: '90% accuracy with 10+ answers', xpValue: 200 },
          { id: 'perfect_score',      name: 'Perfectionist',      description: 'Got every answer right in a session',icon: 'checkmark-circle' as any, rarity: 'rare',  requirements: '100% accuracy in a session',    xpValue: 150 },
          { id: 'streak_starter',     name: 'Streak Starter',     description: 'Maintained a 3-day streak',          icon: 'flame' as any,        rarity: 'common',    requirements: '3-day streak',                  xpValue: 50 },
          { id: 'week_warrior',       name: 'Week Warrior',       description: 'Maintained a 7-day streak',          icon: 'calendar' as any,     rarity: 'rare',      requirements: '7-day streak',                  xpValue: 150 },
          { id: 'fortnight_flame',    name: 'Fortnight Flame',    description: 'Maintained a 14-day streak',         icon: 'bonfire' as any,      rarity: 'epic',      requirements: '14-day streak',                 xpValue: 300 },
          { id: 'dedicated_learner',  name: 'Dedicated Learner',  description: 'Studied for 30 minutes total',       icon: 'time' as any,         rarity: 'common',    requirements: '30 minutes study time',         xpValue: 75 },
          { id: 'night_scholar',      name: 'Night Scholar',      description: 'Accumulated 60 minutes of study',    icon: 'moon' as any,         rarity: 'rare',      requirements: '60 minutes total study',        xpValue: 150 },
          { id: 'alphabet_ace',       name: 'Alphabet Ace',       description: 'Completed 20 alphabet letters',      icon: 'text' as any,         rarity: 'common',    requirements: 'Learn 20 alphabet letters',     xpValue: 75 },
          { id: 'grammar_guru',       name: 'Grammar Guru',       description: 'Mastered 15 grammar concepts',       icon: 'pencil' as any,       rarity: 'rare',      requirements: 'Learn 15 grammar words',        xpValue: 125 },
          { id: 'quiz_whiz',          name: 'Quiz Whiz',          description: 'Answered 25 quiz questions correctly',icon: 'help-circle' as any, rarity: 'common',    requirements: '25 correct quiz answers',       xpValue: 100 },
          { id: 'consistent',         name: 'Consistent',         description: 'Studied 5 days in a row',            icon: 'checkmark-done' as any, rarity: 'common',  requirements: '5-day streak',                  xpValue: 100 },
          { id: 'streak_master_30',   name: 'Streak Legend',      description: 'Maintained a 30-day streak',         icon: 'ribbon' as any,       rarity: 'legendary', requirements: '30-day streak',                 xpValue: 750 },
          { id: 'hindi_scholar',      name: 'Hindi Scholar',      description: 'Learned 500 Hindi words',            icon: 'school' as any,       rarity: 'legendary', requirements: 'Learn 500 words',               xpValue: 1000 },
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
          case 'first_word':        shouldUnlock = dailyStats.correctAnswers >= 1 || dailyStats.wordsLearned >= 1; break;
          case 'word_warrior':      shouldUnlock = dailyStats.wordsLearned >= 25; break;
          case 'fast_learner':      shouldUnlock = dailyStats.wordsLearned >= 10; break;
          case 'century_club':      shouldUnlock = dailyStats.wordsLearned >= 100; break;
          case 'double_century':    shouldUnlock = dailyStats.wordsLearned >= 200; break;
          case 'accuracy_master':   shouldUnlock = dailyStats.totalAnswers >= 10 && (dailyStats.correctAnswers / dailyStats.totalAnswers) >= 0.9; break;
          case 'perfect_score':     shouldUnlock = dailyStats.totalAnswers >= 5 && dailyStats.correctAnswers === dailyStats.totalAnswers; break;
          case 'streak_starter':    shouldUnlock = dailyStats.streak >= 3; break;
          case 'consistent':        shouldUnlock = dailyStats.streak >= 5; break;
          case 'week_warrior':      shouldUnlock = dailyStats.streak >= 7; break;
          case 'fortnight_flame':   shouldUnlock = dailyStats.streak >= 14; break;
          case 'streak_master_30':  shouldUnlock = dailyStats.streak >= 30; break;
          case 'dedicated_learner': shouldUnlock = dailyStats.studyTimeMinutes >= 30; break;
          case 'night_scholar':     shouldUnlock = dailyStats.studyTimeMinutes >= 60; break;
          case 'alphabet_ace':      shouldUnlock = dailyStats.wordsLearned >= 20; break;
          case 'grammar_guru':      shouldUnlock = dailyStats.wordsLearned >= 15; break;
          case 'quiz_whiz':         shouldUnlock = dailyStats.correctAnswers >= 25; break;
          case 'hindi_scholar':     shouldUnlock = dailyStats.wordsLearned >= 500; break;
          default:                  shouldUnlock = false; break;
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