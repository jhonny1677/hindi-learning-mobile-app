import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

  const getCurrentDateString = () => new Date().toISOString().split('T')[0];

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const loadStreakData = async () => {
    try {
      const stored = await webStorage.getItem(STREAK_STORAGE_KEY);
      if (stored) {
        const data: StreakData = JSON.parse(stored);
        const today = getCurrentDateString();
        const yesterday = getYesterdayDateString();
        setHasStudiedToday(data.studyDates.includes(today));
        if (
          data.lastStudyDate !== today &&
          data.lastStudyDate !== yesterday &&
          data.currentStreak > 0
        ) {
          const reset = { ...data, currentStreak: 0 };
          setStreakData(reset);
          await webStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(reset));
          onStreakUpdate?.(0);
        } else {
          setStreakData(data);
          onStreakUpdate?.(data.currentStreak);
        }
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dow = today.getDay(); // 0 = Sun
    const daysFromMon = dow === 0 ? 6 : dow - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMon);

    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return { label, dateStr, isToday: dateStr === todayStr };
    });
  };

  const weekDays = getWeekDays();
  const bg = (light: string, dark: string) => (darkMode ? dark : light);

  return (
    <View style={[styles.card, { backgroundColor: bg('#FFFFFF', '#1F2937') }]}>
      <Text style={[styles.cardTitle, { color: bg('#1F2937', '#F9FAFB') }]}>🔥 Daily Streak</Text>

      {/* Current + Best sub-cards */}
      <View style={styles.statsRow}>
        <View style={[styles.subCard, { backgroundColor: '#FF6B35' }]}>
          <Text style={[styles.subCardNumber, { color: '#FFFFFF' }]}>
            🔥 {streakData.currentStreak}
          </Text>
          <Text style={[styles.subCardLabel, { color: '#FFFFFF' }]}>Current Streak</Text>
        </View>
        <View style={[styles.subCard, { backgroundColor: '#F59E0B' }]}>
          <Text style={[styles.subCardNumber, { color: '#FFFFFF' }]}>
            ⭐ {streakData.longestStreak}
          </Text>
          <Text style={[styles.subCardLabel, { color: '#FFFFFF' }]}>Best Streak</Text>
        </View>
      </View>

      {/* Zero-streak nudge */}
      {streakData.currentStreak === 0 && (
        <Text style={[styles.zeroMsg, { color: bg('#9CA3AF', '#6B7280') }]}>
          Start your learning journey today!
        </Text>
      )}

      {/* Studied-today badge */}
      {hasStudiedToday && (
        <View style={styles.todayRow}>
          <Ionicons name="checkmark-circle" size={15} color="#10B981" />
          <Text style={[styles.todayText, { color: bg('#065F46', '#34D399') }]}>
            Studied today!
          </Text>
        </View>
      )}

      {/* 7-day week circles */}
      <View style={styles.weekRow}>
        {weekDays.map((day, i) => {
          const studied = streakData.studyDates.includes(day.dateStr);
          return (
            <View key={i} style={styles.dayCol}>
              <View
                style={[
                  styles.dayCircle,
                  studied
                    ? styles.dayCircleStudied
                    : day.isToday
                      ? [styles.dayCircleToday, { borderColor: bg('#F97316', '#FB923C') }]
                      : { backgroundColor: bg('#F3F4F6', '#374151') },
                ]}
              >
                <Text
                  style={[
                    styles.dayLetter,
                    studied
                      ? styles.dayLetterStudied
                      : { color: day.isToday ? bg('#F97316', '#FB923C') : bg('#9CA3AF', '#6B7280') },
                  ]}
                >
                  {day.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={[styles.totalDays, { color: bg('#9CA3AF', '#6B7280') }]}>
        {streakData.studyDates.length} total study days
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  subCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  subCardNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subCardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  zeroMsg: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 10,
  },
  todayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayCol: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleStudied: {
    backgroundColor: '#F97316',
  },
  dayCircleToday: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  dayLetter: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayLetterStudied: {
    color: '#FFFFFF',
  },
  totalDays: {
    fontSize: 11,
    textAlign: 'center',
  },
});
