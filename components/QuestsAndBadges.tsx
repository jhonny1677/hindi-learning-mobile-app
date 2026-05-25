import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { webStorage } from '../utils/webStorage';
import { useAppContext } from '../contexts/AppContext';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement' | 'milestone';
  category: 'study' | 'streak' | 'social' | 'progress';
  target: number;
  progress: number;
  xpReward: number;
  isCompleted: boolean;
  completedAt?: string;
  expiresAt?: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  requirements: string;
  xpValue: number;
}

export interface UserXP {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpHistory: Array<{
    date: string;
    xp: number;
    source: string;
    description: string;
  }>;
}

interface QuestsAndBadgesProps {
  visible: boolean;
  onClose: () => void;
  userStats: {
    streak: number;
    wordsLearned: number;
    studyTime: number;
    level: string;
  };
}

const QUESTS_STORAGE_KEY = 'hindi_learning_quests';
const BADGES_STORAGE_KEY = 'hindi_learning_badges';
const XP_STORAGE_KEY = 'hindi_learning_xp';

// Default quests that regenerate
const questTemplates: Omit<Quest, 'id' | 'progress' | 'isCompleted'>[] = [
  { title: 'Daily Dedication',   description: 'Study for at least 5 minutes today',   type: 'daily',       category: 'study',    target: 5,  xpReward: 50,  icon: 'book' },
  { title: 'Streak Keeper',      description: 'Mark today as complete',                type: 'daily',       category: 'streak',   target: 1,  xpReward: 30,  icon: 'flame' },
  { title: 'Word Explorer',      description: 'Learn 3 new words today',               type: 'daily',       category: 'progress', target: 3,  xpReward: 75,  icon: 'library' },
  { title: 'Quick Learner',      description: 'Answer 10 questions correctly today',   type: 'daily',       category: 'study',    target: 10, xpReward: 100, icon: 'flash' },
  { title: 'Alphabet Practice',  description: 'Study 5 alphabet characters',           type: 'daily',       category: 'progress', target: 5,  xpReward: 60,  icon: 'text' },
  { title: 'Weekly Warrior',     description: 'Study for 7 consecutive days',          type: 'weekly',      category: 'streak',   target: 7,  xpReward: 200, icon: 'trophy' },
  { title: 'Knowledge Seeker',   description: 'Learn 20 words this week',              type: 'weekly',      category: 'progress', target: 20, xpReward: 300, icon: 'school' },
  { title: 'Grammar Student',    description: 'Complete 10 grammar exercises',         type: 'weekly',      category: 'study',    target: 10, xpReward: 150, icon: 'pencil' },
  { title: 'Quiz Champion',      description: 'Complete 3 quizzes this week',          type: 'weekly',      category: 'study',    target: 3,  xpReward: 175, icon: 'help-circle' },
  { title: 'Social Butterfly',   description: 'Share your progress',                   type: 'achievement', category: 'social',   target: 1,  xpReward: 100, icon: 'share' },
  { title: '50 Word Milestone',  description: 'Learn a total of 50 Hindi words',       type: 'milestone',   category: 'progress', target: 50, xpReward: 500, icon: 'medal' },
];

// Available badges
const availableBadges: Badge[] = [
  { id: 'first_word',       name: 'First Steps',      description: 'Learned your first Hindi word',          icon: 'star',            rarity: 'common',    requirements: 'Learn 1 word',              xpValue: 25 },
  { id: 'word_warrior',     name: 'Word Warrior',     description: 'Learned 25 Hindi words',                 icon: 'book',            rarity: 'common',    requirements: 'Learn 25 words',            xpValue: 75 },
  { id: 'fast_learner',     name: 'Fast Learner',     description: 'Learned 10 words in one session',        icon: 'flash',           rarity: 'rare',      requirements: 'Learn 10 words in a day',   xpValue: 100 },
  { id: 'century_club',     name: 'Century Club',     description: 'Reached 100 Hindi words learned',        icon: 'library',         rarity: 'rare',      requirements: 'Learn 100 words',           xpValue: 200 },
  { id: 'double_century',   name: 'Word Master',      description: 'Conquered 200 Hindi words',              icon: 'medal',           rarity: 'epic',      requirements: 'Learn 200 words',           xpValue: 400 },
  { id: 'hindi_scholar',    name: 'Hindi Scholar',    description: 'Learned 500 Hindi words',                icon: 'school',          rarity: 'legendary', requirements: 'Learn 500 words',           xpValue: 1000 },
  { id: 'accuracy_master',  name: 'Sharp Mind',       description: 'Achieved 90% accuracy',                  icon: 'trophy',          rarity: 'epic',      requirements: '90% accuracy (10+ answers)',xpValue: 200 },
  { id: 'perfect_score',    name: 'Perfectionist',    description: 'Got every answer right in a session',    icon: 'checkmark-circle',rarity: 'rare',      requirements: '100% accuracy in a session',xpValue: 150 },
  { id: 'quiz_whiz',        name: 'Quiz Whiz',        description: 'Answered 25 quiz questions correctly',   icon: 'help-circle',     rarity: 'common',    requirements: '25 correct quiz answers',   xpValue: 100 },
  { id: 'streak_starter',   name: 'Streak Starter',   description: 'Maintained a 3-day streak',              icon: 'flame',           rarity: 'common',    requirements: '3-day streak',              xpValue: 50 },
  { id: 'consistent',       name: 'Consistent',       description: 'Kept a 5-day learning streak',           icon: 'checkmark-done',  rarity: 'common',    requirements: '5-day streak',              xpValue: 100 },
  { id: 'week_warrior',     name: 'Week Warrior',     description: 'Maintained a 7-day streak',              icon: 'calendar',        rarity: 'rare',      requirements: '7-day streak',              xpValue: 150 },
  { id: 'fortnight_flame',  name: 'Fortnight Flame',  description: 'Maintained a 14-day streak',             icon: 'bonfire',         rarity: 'epic',      requirements: '14-day streak',             xpValue: 300 },
  { id: 'streak_master_30', name: 'Streak Legend',    description: 'Maintained a 30-day streak',             icon: 'ribbon',          rarity: 'legendary', requirements: '30-day streak',             xpValue: 750 },
  { id: 'dedicated_learner',name: 'Dedicated',        description: 'Studied for 30 minutes total',           icon: 'time',            rarity: 'common',    requirements: '30 min study time',         xpValue: 75 },
  { id: 'night_scholar',    name: 'Night Scholar',    description: 'Accumulated 60 minutes of study',        icon: 'moon',            rarity: 'rare',      requirements: '60 min total study',        xpValue: 150 },
  { id: 'alphabet_ace',     name: 'Alphabet Ace',     description: 'Completed 20 alphabet characters',       icon: 'text',            rarity: 'common',    requirements: 'Learn 20 alphabet letters', xpValue: 75 },
  { id: 'grammar_guru',     name: 'Grammar Guru',     description: 'Mastered 15 grammar concepts',           icon: 'pencil',          rarity: 'rare',      requirements: 'Learn 15 grammar words',    xpValue: 125 },
];

export default function QuestsAndBadges({ visible, onClose, userStats }: QuestsAndBadgesProps) {
  const { state } = useAppContext();
  const { darkMode } = state;
  
  const [activeTab, setActiveTab] = useState<'quests' | 'badges' | 'leaderboard'>('quests');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [badges, setBadges] = useState<Badge[]>(availableBadges);
  const [userXP, setUserXP] = useState<UserXP>({
    totalXP: 0,
    level: 1,
    currentLevelXP: 0,
    nextLevelXP: 100,
    xpHistory: [],
  });

  useEffect(() => {
    if (visible) {
      loadData();
      generateDailyQuests();
      checkBadgeProgress();
    }
  }, [visible, userStats]);

  const loadData = async () => {
    try {
      // Load quests
      const storedQuests = await webStorage.getItem(QUESTS_STORAGE_KEY);
      if (storedQuests) {
        setQuests(JSON.parse(storedQuests));
      }

      // Load badges
      const storedBadges = await webStorage.getItem(BADGES_STORAGE_KEY);
      if (storedBadges) {
        setBadges(JSON.parse(storedBadges));
      }

      // Load XP
      const storedXP = await webStorage.getItem(XP_STORAGE_KEY);
      if (storedXP) {
        setUserXP(JSON.parse(storedXP));
      }
    } catch (error) {
      console.error('Error loading quests and badges data:', error);
    }
  };

  const calculateLevel = (totalXP: number) => {
    const level = Math.floor(totalXP / 100) + 1;
    const currentLevelXP = totalXP % 100;
    const nextLevelXP = 100;
    return { level, currentLevelXP, nextLevelXP };
  };

  const awardXP = async (xp: number, source: string, description: string) => {
    try {
      const newTotalXP = userXP.totalXP + xp;
      const levelInfo = calculateLevel(newTotalXP);
      
      const updatedXP: UserXP = {
        totalXP: newTotalXP,
        ...levelInfo,
        xpHistory: [
          ...userXP.xpHistory,
          {
            date: new Date().toISOString(),
            xp,
            source,
            description,
          },
        ],
      };

      setUserXP(updatedXP);
      await webStorage.setItem(XP_STORAGE_KEY, JSON.stringify(updatedXP));

      // Show level up notification
      if (levelInfo.level > userXP.level) {
        Alert.alert(
          '🎉 Level Up!',
          `Congratulations! You reached level ${levelInfo.level}!`,
          [{ text: 'Awesome!' }]
        );
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  };

  const generateDailyQuests = async () => {
    try {
      const today = new Date().toDateString();
      const existingQuests = quests.filter(q => 
        q.type !== 'daily' || new Date(q.expiresAt || '').toDateString() === today
      );

      // Generate new daily quests if needed
      const dailyQuests = questTemplates
        .filter(template => template.type === 'daily')
        .map(template => ({
          ...template,
          id: `${template.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          progress: 0,
          isCompleted: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }));

      const updatedQuests = [...existingQuests, ...dailyQuests];
      setQuests(updatedQuests);
      await webStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(updatedQuests));
    } catch (error) {
      console.error('Error generating daily quests:', error);
    }
  };

  const checkBadgeProgress = async () => {
    try {
      const updatedBadges = badges.map(badge => {
        if (badge.unlockedAt) return badge;

        let shouldUnlock = false;
        switch (badge.id) {
          case 'first_word':
            shouldUnlock = userStats.wordsLearned >= 1;
            break;
          case 'word_collector_50':
            shouldUnlock = userStats.wordsLearned >= 50;
            break;
          case 'streak_master_30':
            shouldUnlock = userStats.streak >= 30;
            break;
          case 'hindi_scholar':
            shouldUnlock = userStats.level === 'advanced' || userStats.level === 'expert';
            break;
        }

        if (shouldUnlock) {
          awardXP(badge.xpValue, 'badge', `Unlocked ${badge.name} badge`);
          return {
            ...badge,
            unlockedAt: new Date().toISOString(),
          };
        }

        return badge;
      });

      setBadges(updatedBadges);
      await webStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(updatedBadges));
    } catch (error) {
      console.error('Error checking badge progress:', error);
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const updatedQuests = quests.map(quest => {
        if (quest.id === questId && !quest.isCompleted) {
          awardXP(quest.xpReward, 'quest', `Completed ${quest.title}`);
          return {
            ...quest,
            isCompleted: true,
            completedAt: new Date().toISOString(),
          };
        }
        return quest;
      });

      setQuests(updatedQuests);
      await webStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(updatedQuests));
      
      Alert.alert('Quest Completed!', `You earned ${quests.find(q => q.id === questId)?.xpReward} XP!`);
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderQuests = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.tabTitle, darkMode && styles.darkText]}>Active Quests</Text>
      
      {quests.map((quest) => (
        <View
          key={quest.id}
          style={[
            styles.questItem,
            darkMode && styles.darkQuestItem,
            quest.isCompleted && styles.completedQuest,
          ]}
        >
          <View style={styles.questIcon}>
            <Ionicons
              name={quest.icon}
              size={24}
              color={quest.isCompleted ? '#10B981' : (darkMode ? '#A78BFA' : '#4F46E5')}
            />
          </View>
          
          <View style={styles.questInfo}>
            <Text style={[styles.questTitle, darkMode && styles.darkText]}>
              {quest.title}
            </Text>
            <Text style={[styles.questDescription, darkMode && styles.darkDescription]}>
              {quest.description}
            </Text>
            
            <View style={styles.questProgress}>
              <View style={[styles.progressBar, darkMode && styles.darkProgressBar]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, darkMode && styles.darkText]}>
                {quest.progress}/{quest.target}
              </Text>
            </View>
          </View>
          
          <View style={styles.questReward}>
            <Text style={[styles.xpReward, darkMode && styles.darkXpReward]}>
              +{quest.xpReward} XP
            </Text>
            {quest.progress >= quest.target && !quest.isCompleted && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => completeQuest(quest.id)}
              >
                <Text style={styles.completeButtonText}>Claim</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const getRarityStars = (rarity: Badge['rarity']) => {
    const map = { common: '★', rare: '★★', epic: '★★★', legendary: '★★★★' };
    return map[rarity] || '★';
  };

  const unlockedCount = badges.filter(b => !!b.unlockedAt).length;

  const renderBadges = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.badgeHeader}>
        <Text style={[styles.tabTitle, darkMode && styles.darkText]}>Badges</Text>
        <View style={[styles.badgeCountPill, { backgroundColor: '#4F46E5' }]}>
          <Text style={styles.badgeCountText}>{unlockedCount}/{badges.length}</Text>
        </View>
      </View>

      <View style={styles.badgeGrid}>
        {badges.map((badge) => {
          const isUnlocked = !!badge.unlockedAt;
          const color = getRarityColor(badge.rarity);
          return (
            <View
              key={badge.id}
              style={[
                styles.badgeItem,
                darkMode && styles.darkBadgeItem,
                isUnlocked && { borderColor: color, borderWidth: 1.5 },
                !isUnlocked && { opacity: 0.55 },
              ]}
            >
              <View style={[
                styles.badgeIcon,
                { backgroundColor: isUnlocked ? color + '18' : (darkMode ? '#374151' : '#F3F4F6'), borderColor: isUnlocked ? color : (darkMode ? '#4B5563' : '#E5E7EB') },
              ]}>
                {!isUnlocked && (
                  <Ionicons name="lock-closed" size={14} color={darkMode ? '#6B7280' : '#9CA3AF'} style={styles.lockOverlay} />
                )}
                <Ionicons
                  name={badge.icon}
                  size={30}
                  color={isUnlocked ? color : (darkMode ? '#4B5563' : '#D1D5DB')}
                />
              </View>

              <Text style={[styles.badgeName, { color: isUnlocked ? color : (darkMode ? '#9CA3AF' : '#6B7280') }]} numberOfLines={1}>
                {badge.name}
              </Text>

              <Text style={[styles.badgeDescription, darkMode && styles.darkDescription]} numberOfLines={2}>
                {isUnlocked ? badge.description : badge.requirements}
              </Text>

              <View style={[styles.rarityBadge, { backgroundColor: isUnlocked ? color : (darkMode ? '#374151' : '#E5E7EB') }]}>
                <Text style={[styles.rarityText, { color: isUnlocked ? '#fff' : (darkMode ? '#9CA3AF' : '#6B7280') }]}>
                  {getRarityStars(badge.rarity)} {badge.rarity}
                </Text>
              </View>

              {isUnlocked && (
                <Text style={[styles.xpValue, { color }]}>+{badge.xpValue} XP earned</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderXPLeaderboard = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.tabTitle, darkMode && styles.darkText]}>Your Progress</Text>
      
      <View style={[styles.xpCard, darkMode && styles.darkXpCard]}>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelNumber, darkMode && styles.darkText]}>
            Level {userXP.level}
          </Text>
          <Text style={[styles.totalXP, darkMode && styles.darkDescription]}>
            {userXP.totalXP} Total XP
          </Text>
        </View>
        
        <View style={styles.xpProgress}>
          <View style={[styles.xpProgressBar, darkMode && styles.darkProgressBar]}>
            <View
              style={[
                styles.progressFill,
                { width: `${(userXP.currentLevelXP / userXP.nextLevelXP) * 100}%` },
              ]}
            />
          </View>
          <Text style={[styles.xpProgressText, darkMode && styles.darkText]}>
            {userXP.currentLevelXP}/{userXP.nextLevelXP} XP to next level
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Recent XP History</Text>
      {userXP.xpHistory.slice(-10).reverse().map((entry, index) => (
        <View key={index} style={[styles.xpHistoryItem, darkMode && styles.darkXpHistoryItem]}>
          <View>
            <Text style={[styles.xpSource, darkMode && styles.darkText]}>
              {entry.description}
            </Text>
            <Text style={[styles.xpDate, darkMode && styles.darkDescription]}>
              {new Date(entry.date).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.xpAmount, darkMode && styles.darkXpReward]}>
            +{entry.xp} XP
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={darkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.darkText]}>
            Quests & Badges
          </Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>{userXP.totalXP} XP</Text>
          </View>
        </View>

        <View style={[styles.tabs, darkMode && styles.darkTabs]}>
          {[
            { key: 'quests', label: 'Quests', icon: 'list' },
            { key: 'badges', label: 'Badges', icon: 'trophy' },
            { key: 'leaderboard', label: 'Progress', icon: 'stats-chart' },
          ].map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tab,
                activeTab === key && styles.activeTab,
                activeTab === key && darkMode && styles.darkActiveTab,
              ]}
              onPress={() => setActiveTab(key as any)}
            >
              <Ionicons
                name={icon as any}
                size={16}
                color={
                  activeTab === key
                    ? (darkMode ? '#A78BFA' : '#4F46E5')
                    : (darkMode ? '#9CA3AF' : '#6B7280')
                }
              />
              <Text style={[
                styles.tabText,
                darkMode && styles.darkTabText,
                activeTab === key && styles.activeTabText,
                activeTab === key && darkMode && styles.darkActiveTabText,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'quests' && renderQuests()}
        {activeTab === 'badges' && renderBadges()}
        {activeTab === 'leaderboard' && renderXPLeaderboard()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  darkHeader: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#4B5563',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  darkText: {
    color: '#F9FAFB',
  },
  xpBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  darkTabs: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#4B5563',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  darkActiveTab: {
    borderBottomColor: '#A78BFA',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  darkTabText: {
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  darkActiveTabText: {
    color: '#A78BFA',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  questItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkQuestItem: {
    backgroundColor: '#1F2937',
  },
  completedQuest: {
    opacity: 0.7,
  },
  questIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  darkDescription: {
    color: '#9CA3AF',
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  darkProgressBar: {
    backgroundColor: '#374151',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    minWidth: 40,
  },
  questReward: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpReward: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  darkXpReward: {
    color: '#A78BFA',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  darkBadgeItem: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  unlockedBadge: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  darkBadgeIcon: {
    backgroundColor: '#374151',
    borderColor: '#6B7280',
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  xpCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkXpCard: {
    backgroundColor: '#1F2937',
  },
  levelInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  totalXP: {
    fontSize: 16,
    color: '#6B7280',
  },
  xpProgress: {
    alignItems: 'center',
  },
  xpProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  xpProgressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  xpHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  darkXpHistoryItem: {
    backgroundColor: '#1F2937',
  },
  xpSource: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  xpDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  xpAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});