import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { databaseService } from '../database/database';
import { useAppContext } from '../contexts/AppContext';

interface CategoryStatsProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'alphabet' | 'grammar';
  color: string;
  onPress?: (e?: any) => void;
}

const CategoryStats: React.FC<CategoryStatsProps> = ({ difficulty, color }) => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
    isComplete: false,
  });
  const { state } = useAppContext();
  const { darkMode } = state;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const progress = await databaseService.getDifficultyProgress(difficulty);
        const pct =
          progress.totalWords > 0
            ? Math.round((progress.learnedWords / progress.totalWords) * 100)
            : 0;
        setStats({
          total: progress.totalWords,
          completed: progress.learnedWords,
          percentage: pct,
          isComplete: progress.learnedWords >= progress.totalWords,
        });
      } catch {
        setStats({ total: 0, completed: 0, percentage: 0, isComplete: false });
      }
    };
    fetchStats();
  }, [difficulty]);

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: darkMode ? '#374151' : '#E5E7EB' }]}>
        <View
          style={[
            styles.fill,
            // React Native Web accepts % widths; native ignores unknown values gracefully
            { width: `${stats.percentage}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>
        {stats.isComplete
          ? '✅ All words mastered!'
          : `${stats.completed} of ${stats.total} words`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  fill: {
    height: '100%' as any,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CategoryStats;
