import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppContext } from '../contexts/AppContext';

interface QuizResultsProps {
  score: { correct: number; total: number };
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  onRetry: () => void;
  onBack: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ score, difficulty, onRetry, onBack }) => {
  const { state } = useAppContext();
  const { darkMode } = state;
  
  const percentage = Math.round((score.correct / score.total) * 100);
  
  const getScoreMessage = () => {
    if (percentage >= 90) return { emoji: '🏆', message: 'Excellent!', color: '#10B981' };
    if (percentage >= 80) return { emoji: '🎉', message: 'Great job!', color: '#3B82F6' };
    if (percentage >= 70) return { emoji: '👍', message: 'Well done!', color: '#F59E0B' };
    if (percentage >= 60) return { emoji: '😊', message: 'Good effort!', color: '#8B5CF6' };
    return { emoji: '💪', message: 'Keep practicing!', color: '#EF4444' };
  };

  const scoreInfo = getScoreMessage();

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={[styles.title, darkMode && styles.darkText]}>Quiz Complete!</Text>
        <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
          {difficulty.toUpperCase()} LEVEL
        </Text>

        {/* Score Display */}
        <View style={[styles.scoreContainer, { borderColor: scoreInfo.color }]}>
          <Text style={styles.emoji}>{scoreInfo.emoji}</Text>
          <Text style={[styles.scoreText, { color: scoreInfo.color }]}>{percentage}%</Text>
          <Text style={[styles.scoreDetails, darkMode && styles.darkText]}>
            {score.correct} out of {score.total} correct
          </Text>
          <Text style={[styles.message, { color: scoreInfo.color }]}>{scoreInfo.message}</Text>
        </View>

        {/* Performance breakdown */}
        <View style={[styles.breakdownContainer, darkMode && styles.darkBreakdownContainer]}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, darkMode && styles.darkText]}>Correct Answers:</Text>
            <Text style={[styles.statValue, styles.correctValue]}>{score.correct}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, darkMode && styles.darkText]}>Wrong Answers:</Text>
            <Text style={[styles.statValue, styles.incorrectValue]}>{score.total - score.correct}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, darkMode && styles.darkText]}>Accuracy Rate:</Text>
            <Text style={[styles.statValue, { color: scoreInfo.color }]}>{percentage}%</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={onRetry}
          >
            <Text style={styles.buttonText}>🔄 Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.backButton, darkMode && styles.darkBackButton]} 
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, darkMode && styles.darkText]}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return '#10B981';
    case 'intermediate': return '#F59E0B';
    case 'advanced': return '#3B82F6';
    case 'expert': return '#EF4444';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 30,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  breakdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkBreakdownContainer: {
    backgroundColor: '#374151',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  correctValue: {
    color: '#10B981',
  },
  incorrectValue: {
    color: '#EF4444',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#4F46E5',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  darkBackButton: {
    backgroundColor: '#4B5563',
    borderColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  darkText: {
    color: '#F9FAFB',
  },
});

export default QuizResults;