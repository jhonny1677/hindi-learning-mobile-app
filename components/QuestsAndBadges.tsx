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
  {
    title: 'Daily Dedication',
    description: 'Study for at least 5 minutes today',
    type: 'daily',
    category: 'study',
    target: 5,
    xpReward: 50,
    icon: 'book',
  },
  {
    title: 'Streak Keeper',
    description: 'Maintain your learning streak',
    type: 'daily',
    category: 'streak',
    target: 1,
    xpReward: 30,
    icon: 'flame',
  },
  {
    title: 'Word Explorer',
    description: 'Learn 3 new words today',
    type: 'daily',
    category: 'progress',
    target: 3,
    xpReward: 75,
    icon: 'library',
  },
  {
    title: 'Weekly Warrior',
    description: 'Study for 7 days this week',
    type: 'weekly',
    category: 'streak',
    target: 7,
    xpReward: 200,
    icon: 'trophy',
  },
  {
    title: 'Knowledge Seeker',
    description: 'Learn 20 words this week',
    type: 'weekly',
    category: 'progress',
    target: 20,
    xpReward: 300,
    icon: 'school',
  },
  {
    title: 'Social Butterfly',
    description: 'Share your progress',
    type: 'achievement',
    category: 'social',
    target: 1,
    xpReward: 100,
    icon: 'share',
  },
];

// Available badges
const availableBadges: Badge[] = [
  {
    id: 'first_word',
    name: 'First Steps',
    description: 'Learned your first Hindi word',
    icon: 'star',
    rarity: 'common',
    requirements: 'Learn 1 word',
    xpValue: 25,
  },
  {
    id: 'word_collector_50',
    name: 'Word Collector',
    description: 'Collected 50 Hindi words',
    icon: 'library',
    rarity: 'rare',
    requirements: 'Learn 50 words',
    xpValue: 150,
  },
  {
    id: 'streak_master_30',
    name: 'Streak Master',
    description: 'Maintained a 30-day streak',
    icon: 'flame',
    rarity: 'epic',
    requirements: '30-day streak',
    xpValue: 500,
  },
  {
    id: 'hindi_scholar',
    name: 'Hindi Scholar',
    description: 'Reached advanced level',
    icon: 'school',
    rarity: 'legendary',
    requirements: 'Advanced level',
    xpValue: 1000,
  },
  {
    id: 'social_sharer',
    name: 'Social Sharer',
    description: 'Shared progress with friends',
    icon: 'people',
    rarity: 'common',
    requirements: 'Share progress',
    xpValue: 50,
  },
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

  const renderBadges = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.tabTitle, darkMode && styles.darkText]}>Badges Collection</Text>
      
      <View style={styles.badgeGrid}>
        {badges.map((badge) => {
          const isUnlocked = !!badge.unlockedAt;
          return (
            <View
              key={badge.id}
              style={[
                styles.badgeItem,
                darkMode && styles.darkBadgeItem,
                isUnlocked && styles.unlockedBadge,
              ]}
            >
              <View style={[
                styles.badgeIcon,
                darkMode && styles.darkBadgeIcon,
                { borderColor: getRarityColor(badge.rarity) },
                isUnlocked && { backgroundColor: getRarityColor(badge.rarity) + '20' },
              ]}>
                <Ionicons
                  name={badge.icon}
                  size={32}
                  color={isUnlocked ? getRarityColor(badge.rarity) : (darkMode ? '#6B7280' : '#9CA3AF')}
                />
              </View>
              
              <Text style={[
                styles.badgeName,
                darkMode && styles.darkText,
                { color: isUnlocked ? getRarityColor(badge.rarity) : undefined },
              ]}>
                {badge.name}
              </Text>
              
              <Text style={[styles.badgeDescription, darkMode && styles.darkDescription]}>
                {badge.description}
              </Text>
              
              <View style={[
                styles.rarityBadge,
                { backgroundColor: getRarityColor(badge.rarity) },
              ]}>
                <Text style={styles.rarityText}>
                  {badge.rarity.toUpperCase()}
                </Text>
              </View>
              
              {isUnlocked && (
                <Text style={styles.xpValue}>+{badge.xpValue} XP</Text>
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
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkBadgeItem: {
    backgroundColor: '#1F2937',
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
    marginBottom: 12,
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