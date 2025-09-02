import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { webStorage } from '../utils/webStorage';
import { useAppContext } from '../contexts/AppContext';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  studyDates: string[];
}

interface StreakTrackerProps {
  onStreakUpdate?: (streak: number) => void;
}

const STREAK_STORAGE_KEY = 'hindi_learning_streak';

export default function StreakTracker({ onStreakUpdate }: StreakTrackerProps) {
  const { state } = useAppContext();
  const { darkMode } = state;
  
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: '',
    studyDates: [],
  });
  const [hasStudiedToday, setHasStudiedToday] = useState(false);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const stored = await webStorage.getItem(STREAK_STORAGE_KEY);
      if (stored) {
        const data: StreakData = JSON.parse(stored);
        setStreakData(data);
        
        const today = getCurrentDateString();
        const hasStudied = data.studyDates.includes(today);
        setHasStudiedToday(hasStudied);
        
        // Check if streak should be broken
        const yesterday = getYesterdayDateString();
        if (data.lastStudyDate !== today && data.lastStudyDate !== yesterday && data.currentStreak > 0) {
          // Streak broken, reset
          const updatedData = {
            ...data,
            currentStreak: 0,
          };
          setStreakData(updatedData);
          await webStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updatedData));
        }
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const saveStreakData = async (data: StreakData) => {
    try {
      await webStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
      setStreakData(data);
      onStreakUpdate?.(data.currentStreak);
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  };

  const getCurrentDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getYesterdayDateString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const markStudySession = async () => {
    const today = getCurrentDateString();
    
    if (hasStudiedToday) {
      Alert.alert('Already Studied!', "You've already marked today as completed. Keep up the great work!");
      return;
    }

    const yesterday = getYesterdayDateString();
    const isConsecutive = streakData.lastStudyDate === yesterday;
    const newCurrentStreak = isConsecutive ? streakData.currentStreak + 1 : 1;
    const newLongestStreak = Math.max(streakData.longestStreak, newCurrentStreak);

    const updatedData: StreakData = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastStudyDate: today,
      studyDates: [...streakData.studyDates, today],
    };

    setHasStudiedToday(true);
    await saveStreakData(updatedData);

    // Show celebration for milestones
    if (newCurrentStreak === 1) {
      Alert.alert('Great Start!', 'You started your learning streak! 🎉');
    } else if (newCurrentStreak % 7 === 0) {
      Alert.alert('Week Streak!', `Amazing! You've studied for ${newCurrentStreak} days in a row! 🔥`);
    } else if (newCurrentStreak % 30 === 0) {
      Alert.alert('Month Streak!', `Incredible! ${newCurrentStreak} days straight of learning! 🌟`);
    } else if (newCurrentStreak > streakData.longestStreak) {
      Alert.alert('New Record!', `New personal best: ${newCurrentStreak} days! 🏆`);
    }
  };

  const getStreakEmoji = () => {
    if (streakData.currentStreak === 0) return '📚';
    if (streakData.currentStreak < 7) return '🔥';
    if (streakData.currentStreak < 30) return '💪';
    return '🏆';
  };

  const getMotivationalMessage = () => {
    if (!hasStudiedToday && streakData.currentStreak > 0) {
      return "Don't break your streak! Study today to keep it going.";
    }
    if (!hasStudiedToday) {
      return 'Start your learning journey today!';
    }
    return "Great job! You've studied today!";
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkTitle]}>Daily Streak</Text>
        <Text style={styles.emoji}>{getStreakEmoji()}</Text>
      </View>

      <View style={styles.streakContainer}>
        <View style={styles.streakItem}>
          <Text style={[styles.streakNumber, darkMode && styles.darkStreakNumber]}>{streakData.currentStreak}</Text>
          <Text style={[styles.streakLabel, darkMode && styles.darkText]}>Current Streak</Text>
        </View>
        <View style={[styles.divider, darkMode && styles.darkDivider]} />
        <View style={styles.streakItem}>
          <Text style={[styles.streakNumber, darkMode && styles.darkStreakNumber]}>{streakData.longestStreak}</Text>
          <Text style={[styles.streakLabel, darkMode && styles.darkText]}>Best Streak</Text>
        </View>
      </View>

      <Text style={[styles.motivationText, darkMode && styles.darkText]}>{getMotivationalMessage()}</Text>

      {!hasStudiedToday && (
        <TouchableOpacity style={[styles.studyButton, darkMode && styles.darkStudyButton]} onPress={markStudySession}>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.studyButtonText}>Mark Today Complete</Text>
        </TouchableOpacity>
      )}

      {hasStudiedToday && (
        <View style={[styles.completedContainer, darkMode && styles.darkCompletedContainer]}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={[styles.completedText, darkMode && styles.darkCompletedText]}>Completed for today!</Text>
        </View>
      )}

      <Text style={[styles.totalDays, darkMode && styles.darkText]}>
        Total study days: {streakData.studyDates.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkContainer: {
    backgroundColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  darkTitle: {
    color: '#F9FAFB',
  },
  emoji: {
    fontSize: 24,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  darkStreakNumber: {
    color: '#A78BFA',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  darkDivider: {
    backgroundColor: '#6B7280',
  },
  darkText: {
    color: '#D1D5DB',
  },
  motivationText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  studyButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  darkStudyButton: {
    backgroundColor: '#6366F1',
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  darkCompletedContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  completedText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  darkCompletedText: {
    color: '#34D399',
  },
  totalDays: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});