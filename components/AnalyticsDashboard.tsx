import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LearningAnalytics, databaseService } from '../database/database';
import { useAppContext } from '../contexts/AppContext';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const { state, setAnalytics: setAnalyticsStore } = useAppContext();
  const storeAnalytics = state.analytics;
  const { darkMode } = state;

  // Strict-mode-safe: ensure the effect runs only once
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await databaseService.getLearningAnalytics();
        if (cancelled) return;

        setAnalytics(data);

        // Only update the store if it’s actually different
        const isSame =
          storeAnalytics === data ||
          (storeAnalytics && data
            ? JSON.stringify(storeAnalytics) === JSON.stringify(data)
            : storeAnalytics === data);

        if (!isSame) {
          setAnalyticsStore(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // no deps; guarded by didInit

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <Text style={[styles.headerTitle, darkMode && styles.darkText]}>📊 Learning Analytics</Text>
        <TouchableOpacity onPress={onClose} style={[styles.closeButton, darkMode && styles.darkCloseButton]}>
          <Text style={[styles.closeButtonText, darkMode && styles.darkText]}>✕</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {analytics ? (
            <View>
              {/* Overview Stats */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                  <Text style={styles.statEmoji}>📚</Text>
                  <Text style={[styles.statNumber, { color: '#D97706' }]}>{analytics.totalWordsLearned}</Text>
                  <Text style={[styles.statLabel, { color: '#92400E' }]}>Words Learned</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}>
                  <Text style={styles.statEmoji}>🎯</Text>
                  <Text style={[styles.statNumber, { color: '#2563EB' }]}>{analytics.accuracyRate}%</Text>
                  <Text style={[styles.statLabel, { color: '#1D4ED8' }]}>Accuracy</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#DCFCE7', borderColor: '#10B981' }]}>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={[styles.statNumber, { color: '#059669' }]}>{analytics.dailyStreak}</Text>
                  <Text style={[styles.statLabel, { color: '#047857' }]}>Day Streak</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FDF2F8', borderColor: '#EC4899' }]}>
                  <Text style={styles.statEmoji}>⚡</Text>
                  <Text style={[styles.statNumber, { color: '#DB2777' }]}>{analytics.averageResponseTime}ms</Text>
                  <Text style={[styles.statLabel, { color: '#BE185D' }]}>Speed</Text>
                </View>
              </View>

              {/* Simple Progress */}
              <View style={styles.simpleSection}>
                <View style={[styles.simpleCard, { backgroundColor: '#F0F9FF', borderLeftColor: '#0EA5E9' }]}>
                  <Text style={styles.simpleTitle}>📈 Learning Speed</Text>
                  <Text style={styles.simpleValue}>{analytics.learningVelocity} words/day</Text>
                </View>
                <View style={[styles.simpleCard, { backgroundColor: '#F0FDF4', borderLeftColor: '#22C55E' }]}>
                  <Text style={styles.simpleTitle}>🧠 Retention</Text>
                  <Text style={styles.simpleValue}>{analytics.retentionRate}%</Text>
                </View>
              </View>

              {/* Best & Focus */}
              <View style={styles.simpleSection}>
                <View style={[styles.simpleCard, { backgroundColor: '#FEF7CD', borderLeftColor: '#EAB308' }]}>
                  <Text style={styles.simpleTitle}>💪 Best Level</Text>
                  <Text style={styles.simpleValue}>{analytics.strongestCategory}</Text>
                </View>
                <View style={[styles.simpleCard, { backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444' }]}>
                  <Text style={styles.simpleTitle}>🎯 Focus On</Text>
                  <Text style={styles.simpleValue}>{analytics.weakestCategory}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataEmoji}>📊</Text>
              <Text style={styles.noDataTitle}>No Analytics Yet</Text>
              <Text style={styles.noDataText}>Start learning to see your progress and statistics!</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  darkHeader: {
    backgroundColor: '#374151',
    borderBottomColor: '#4B5563',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkCloseButton: {
    backgroundColor: '#4B5563',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  darkText: {
    color: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '47%',
    borderWidth: 2,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#4B5563',
  },
  categoryLabel: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  achievementCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  achievementText: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  simpleSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  simpleCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  simpleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  simpleValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
});

export default AnalyticsDashboard;
