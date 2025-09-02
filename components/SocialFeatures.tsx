import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { webStorage } from '../utils/webStorage';
import { useAppContext } from '../contexts/AppContext';

interface LeaderboardEntry {
  id: string;
  name: string;
  streak: number;
  wordsLearned: number;
  studyTime: number;
  level: string;
  avatar?: string;
  isCurrentUser?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

interface SocialFeaturesProps {
  visible: boolean;
  onClose: () => void;
  userStats: {
    streak: number;
    wordsLearned: number;
    studyTime: number;
    level: string;
    name: string;
  };
}

const ACHIEVEMENTS_KEY = 'hindi_learning_achievements';
const LEADERBOARD_KEY = 'hindi_learning_leaderboard';

const availableAchievements: Achievement[] = [
  {
    id: 'first_word',
    title: 'First Steps',
    description: 'Learn your first Hindi word',
    icon: 'school',
    target: 1,
  },
  {
    id: 'word_master_10',
    title: 'Word Explorer',
    description: 'Learn 10 Hindi words',
    icon: 'book',
    target: 10,
  },
  {
    id: 'word_master_50',
    title: 'Word Collector',
    description: 'Learn 50 Hindi words',
    icon: 'library',
    target: 50,
  },
  {
    id: 'word_master_100',
    title: 'Word Master',
    description: 'Learn 100 Hindi words',
    icon: 'trophy',
    target: 100,
  },
  {
    id: 'streak_3',
    title: 'Committed Learner',
    description: 'Maintain a 3-day streak',
    icon: 'flame',
    target: 3,
  },
  {
    id: 'streak_7',
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'medal',
    target: 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: 'star',
    target: 30,
  },
  {
    id: 'study_time_60',
    title: 'Dedicated Student',
    description: 'Study for 1 hour total',
    icon: 'time',
    target: 60,
  },
  {
    id: 'study_time_300',
    title: 'Serious Scholar',
    description: 'Study for 5 hours total',
    icon: 'hourglass',
    target: 300,
  },
];

export default function SocialFeatures({ visible, onClose, userStats }: SocialFeaturesProps) {
  const { state } = useAppContext();
  const { darkMode } = state;
  
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (visible) {
      loadLeaderboard();
      loadAchievements();
    }
  }, [visible]);

  useEffect(() => {
    checkAchievements();
  }, [userStats]);

  const loadLeaderboard = async () => {
    try {
      const stored = await webStorage.getItem(LEADERBOARD_KEY);
      let data: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
      
      // Add current user if not present
      const currentUserEntry: LeaderboardEntry = {
        id: 'current_user',
        name: userStats.name || 'You',
        streak: userStats.streak,
        wordsLearned: userStats.wordsLearned,
        studyTime: Math.floor(userStats.studyTime / 60), // Convert to minutes
        level: userStats.level,
        isCurrentUser: true,
      };

      // Remove existing current user entry and add updated one
      data = data.filter(entry => !entry.isCurrentUser);
      data.push(currentUserEntry);

      // Add some mock entries for demonstration
      if (data.length === 1) {
        const mockEntries: LeaderboardEntry[] = [
          {
            id: 'user1',
            name: 'Priya Sharma',
            streak: 15,
            wordsLearned: 120,
            studyTime: 180,
            level: 'intermediate',
          },
          {
            id: 'user2',
            name: 'Rahul Kumar',
            streak: 8,
            wordsLearned: 85,
            studyTime: 145,
            level: 'beginner',
          },
          {
            id: 'user3',
            name: 'Anita Patel',
            streak: 22,
            wordsLearned: 200,
            studyTime: 280,
            level: 'advanced',
          },
          {
            id: 'user4',
            name: 'Amit Singh',
            streak: 5,
            wordsLearned: 45,
            studyTime: 90,
            level: 'beginner',
          },
        ];
        data = [...data, ...mockEntries];
      }

      // Sort by streak (descending)
      data.sort((a, b) => b.streak - a.streak);
      
      await webStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const stored = await webStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedAchievements: string[] = stored ? JSON.parse(stored) : [];
      
      const achievementsWithProgress = availableAchievements.map(achievement => {
        const isUnlocked = unlockedAchievements.includes(achievement.id);
        let progress = 0;

        // Calculate progress based on achievement type
        if (achievement.id.includes('word_master')) {
          progress = userStats.wordsLearned;
        } else if (achievement.id.includes('streak')) {
          progress = userStats.streak;
        } else if (achievement.id.includes('study_time')) {
          progress = Math.floor(userStats.studyTime / 60); // Convert to minutes
        }

        return {
          ...achievement,
          progress,
          unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
        };
      });

      setAchievements(achievementsWithProgress);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const checkAchievements = async () => {
    try {
      const stored = await webStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedAchievements: string[] = stored ? JSON.parse(stored) : [];
      const newlyUnlocked: string[] = [];

      for (const achievement of availableAchievements) {
        if (unlockedAchievements.includes(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.id) {
          case 'first_word':
            shouldUnlock = userStats.wordsLearned >= 1;
            break;
          case 'word_master_10':
            shouldUnlock = userStats.wordsLearned >= 10;
            break;
          case 'word_master_50':
            shouldUnlock = userStats.wordsLearned >= 50;
            break;
          case 'word_master_100':
            shouldUnlock = userStats.wordsLearned >= 100;
            break;
          case 'streak_3':
            shouldUnlock = userStats.streak >= 3;
            break;
          case 'streak_7':
            shouldUnlock = userStats.streak >= 7;
            break;
          case 'streak_30':
            shouldUnlock = userStats.streak >= 30;
            break;
          case 'study_time_60':
            shouldUnlock = userStats.studyTime >= 3600; // 1 hour in seconds
            break;
          case 'study_time_300':
            shouldUnlock = userStats.studyTime >= 18000; // 5 hours in seconds
            break;
        }

        if (shouldUnlock) {
          newlyUnlocked.push(achievement.id);
          unlockedAchievements.push(achievement.id);
        }
      }

      if (newlyUnlocked.length > 0) {
        await webStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
        
        // Show achievement notification
        const unlockedAchievement = availableAchievements.find(a => a.id === newlyUnlocked[0]);
        if (unlockedAchievement) {
          Alert.alert(
            '🎉 Achievement Unlocked!',
            `${unlockedAchievement.title}\n${unlockedAchievement.description}`,
            [{ text: 'Awesome!' }]
          );
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const shareProgress = async () => {
    try {
      const message = `🎯 My Hindi Learning Progress:\n\n` +
        `📚 Words learned: ${userStats.wordsLearned}\n` +
        `🔥 Current streak: ${userStats.streak} days\n` +
        `⏱️ Study time: ${Math.floor(userStats.studyTime / 3600)}h ${Math.floor((userStats.studyTime % 3600) / 60)}m\n` +
        `📈 Level: ${userStats.level}\n\n` +
        `Join me in learning Hindi! 🇮🇳`;

      await Share.share({
        message,
        title: 'My Hindi Learning Progress',
      });
    } catch (error) {
      console.error('Error sharing progress:', error);
      Alert.alert('Error', 'Failed to share progress');
    }
  };

  const renderLeaderboard = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.leaderboardHeader}>
        <Text style={[styles.tabTitle, darkMode && styles.darkText]}>Leaderboard</Text>
        <TouchableOpacity style={[styles.shareButton, darkMode && styles.darkShareButton]} onPress={shareProgress}>
          <Ionicons name="share-outline" size={20} color={darkMode ? "#A78BFA" : "#4F46E5"} />
          <Text style={[styles.shareText, darkMode && styles.darkShareText]}>Share</Text>
        </TouchableOpacity>
      </View>
      
      {leaderboard.map((entry, index) => (
        <View
          key={entry.id}
          style={[
            styles.leaderboardItem,
            darkMode && styles.darkLeaderboardItem,
            entry.isCurrentUser && styles.currentUserItem,
            entry.isCurrentUser && darkMode && styles.darkCurrentUserItem,
          ]}
        >
          <View style={styles.rankContainer}>
            <Text style={[
              styles.rank,
              darkMode && styles.darkText,
              entry.isCurrentUser && styles.currentUserText,
              entry.isCurrentUser && darkMode && styles.darkCurrentUserText,
            ]}>
              #{index + 1}
            </Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={[
              styles.userName,
              darkMode && styles.darkText,
              entry.isCurrentUser && styles.currentUserText,
              entry.isCurrentUser && darkMode && styles.darkCurrentUserText,
            ]}>
              {entry.name}
              {entry.isCurrentUser && ' (You)'}
            </Text>
            <Text style={[styles.userLevel, darkMode && styles.darkUserLevel]}>{entry.level}</Text>
          </View>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color="#EF4444" />
              <Text style={[styles.statValue, darkMode && styles.darkText]}>{entry.streak}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="book" size={16} color="#3B82F6" />
              <Text style={[styles.statValue, darkMode && styles.darkText]}>{entry.wordsLearned}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color="#8B5CF6" />
              <Text style={[styles.statValue, darkMode && styles.darkText]}>{entry.studyTime}m</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.tabTitle, darkMode && styles.darkText]}>Achievements</Text>
      
      <View style={styles.achievementGrid}>
        {achievements.map((achievement) => {
          const isUnlocked = !!achievement.unlockedAt;
          const progressPercentage = achievement.target 
            ? Math.min((achievement.progress || 0) / achievement.target * 100, 100)
            : 0;

          return (
            <View
              key={achievement.id}
              style={[
                styles.achievementItem,
                darkMode && styles.darkAchievementItem,
                isUnlocked && styles.unlockedAchievement,
                isUnlocked && darkMode && styles.darkUnlockedAchievement,
              ]}
            >
              <View style={[
                styles.achievementIcon,
                darkMode && styles.darkAchievementIcon,
                isUnlocked && styles.unlockedIcon,
                isUnlocked && darkMode && styles.darkUnlockedIcon,
              ]}>
                <Ionicons
                  name={achievement.icon}
                  size={32}
                  color={isUnlocked ? (darkMode ? '#A78BFA' : '#4F46E5') : (darkMode ? '#6B7280' : '#9CA3AF')}
                />
              </View>
              
              <Text style={[
                styles.achievementTitle,
                darkMode && styles.darkText,
                isUnlocked && styles.unlockedText,
                isUnlocked && darkMode && styles.darkUnlockedText,
              ]}>
                {achievement.title}
              </Text>
              
              <Text style={[styles.achievementDescription, darkMode && styles.darkDescription]}>
                {achievement.description}
              </Text>
              
              {!isUnlocked && achievement.target && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, darkMode && styles.darkProgressBar]}>
                    <View
                      style={[
                        styles.progressFill,
                        darkMode && styles.darkProgressFill,
                        { width: `${progressPercentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, darkMode && styles.darkText]}>
                    {achievement.progress}/{achievement.target}
                  </Text>
                </View>
              )}
              
              {isUnlocked && (
                <Text style={[styles.unlockedBadge, darkMode && styles.darkUnlockedBadge]}>Unlocked!</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={darkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.darkText]}>Social</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.tabs, darkMode && styles.darkTabs]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'leaderboard' && styles.activeTab,
              activeTab === 'leaderboard' && darkMode && styles.darkActiveTab,
            ]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Text style={[
              styles.tabText,
              darkMode && styles.darkTabText,
              activeTab === 'leaderboard' && styles.activeTabText,
              activeTab === 'leaderboard' && darkMode && styles.darkActiveTabText,
            ]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'achievements' && styles.activeTab,
              activeTab === 'achievements' && darkMode && styles.darkActiveTab,
            ]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[
              styles.tabText,
              darkMode && styles.darkTabText,
              activeTab === 'achievements' && styles.activeTabText,
              activeTab === 'achievements' && darkMode && styles.darkActiveTabText,
            ]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'leaderboard' ? renderLeaderboard() : renderAchievements()}
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
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
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  shareText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  currentUserItem: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  currentUserText: {
    color: '#4F46E5',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userLevel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 2,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
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
  unlockedAchievement: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  unlockedIcon: {
    backgroundColor: '#EEF2FF',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  unlockedText: {
    color: '#4F46E5',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
  },
  unlockedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  // Dark mode styles
  darkActiveTab: {
    borderBottomColor: '#A78BFA',
  },
  darkTabText: {
    color: '#9CA3AF',
  },
  darkActiveTabText: {
    color: '#A78BFA',
  },
  darkShareButton: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  darkShareText: {
    color: '#A78BFA',
  },
  darkLeaderboardItem: {
    backgroundColor: '#1F2937',
  },
  darkCurrentUserItem: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: '#A78BFA',
  },
  darkCurrentUserText: {
    color: '#A78BFA',
  },
  darkUserLevel: {
    color: '#9CA3AF',
  },
  darkAchievementItem: {
    backgroundColor: '#1F2937',
  },
  darkUnlockedAchievement: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: '#A78BFA',
  },
  darkAchievementIcon: {
    backgroundColor: '#374151',
  },
  darkUnlockedIcon: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  darkUnlockedText: {
    color: '#A78BFA',
  },
  darkDescription: {
    color: '#9CA3AF',
  },
  darkProgressBar: {
    backgroundColor: '#374151',
  },
  darkProgressFill: {
    backgroundColor: '#A78BFA',
  },
  darkUnlockedBadge: {
    color: '#34D399',
  },
});