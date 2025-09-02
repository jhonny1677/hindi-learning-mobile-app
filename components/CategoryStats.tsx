import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { databaseService } from '../database/database';
import { useAppContext } from '../contexts/AppContext';

interface CategoryStatsProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  onPress?: (e?: any) => void;
}

const CategoryStats: React.FC<CategoryStatsProps> = ({ difficulty, onPress }) => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
    isComplete: false
  });

  const { state } = useAppContext();
  const { darkMode } = state;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const progress = await databaseService.getDifficultyProgress(difficulty);
        const percentage = progress.totalWords > 0 
          ? Math.round((progress.learnedWords / progress.totalWords) * 100)
          : 0;
        
        setStats({
          total: progress.totalWords,
          completed: progress.learnedWords,
          percentage: percentage,
          isComplete: progress.learnedWords >= progress.totalWords
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats({
          total: 0,
          completed: 0,
          percentage: 0,
          isComplete: false
        });
      }
    };
    fetchStats();
  }, [difficulty]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.progressTouchable}
        onPress={(e) => {
          e.stopPropagation();
          onPress?.(e);
        }}
      >
        <Text style={[styles.progressText, darkMode && styles.darkProgressText]}>
          {stats.completed}/{stats.total} ({stats.percentage}%)
        </Text>
        {stats.isComplete ? (
          <Text style={styles.completedBadge}>✅ Done</Text>
        ) : (
          <Text style={styles.progressBadge}>📝 {stats.total - stats.completed} left</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressTouchable: {
    flexDirection: 'column',
    gap: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  darkProgressText: {
    color: '#D1D5DB',
  },
  completedBadge: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  progressBadge: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
});

export default CategoryStats;
