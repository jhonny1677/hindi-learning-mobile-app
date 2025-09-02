import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { databaseService, Word } from '../database/database';
import { useAppContext } from '../contexts/AppContext';
import { speakHindi } from '../utils/speechUtils';

interface WordProgressProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'alphabet' | 'grammar';
  onClose: () => void;
}

const WordProgress: React.FC<WordProgressProps> = ({ difficulty, onClose }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const { state } = useAppContext();
  const { darkMode } = state;

  useEffect(() => {
    loadWordProgress();
  }, [difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWordProgress = async () => {
    try {
      setLoading(true);
      await databaseService.init();
      
      // Get all words for this difficulty
      const difficultyWords = await databaseService.getWordsByDifficulty(difficulty);
      setWords(difficultyWords);
      
      // Check which ones are completed
      const completed = new Set<number>();
      for (const word of difficultyWords) {
        const progress = await databaseService.getUserProgress(word.id);
        if (progress && progress.correctAnswers > 0) {
          completed.add(word.id);
        }
      }
      setCompletedWords(completed);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load word progress:', error);
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#2196F3';
      case 'expert': return '#9C27B0';
      default: return '#757575';
    }
  };

  const uncompletedWords = words.filter(word => !completedWords.has(word.id));
  const completedCount = completedWords.size;
  const totalCount = words.length;
  const color = getDifficultyColor(difficulty);

  if (loading) {
    return (
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <Text style={[styles.loadingText, darkMode && styles.darkLoadingText]}>Loading words...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <Text style={[styles.title, { color }, darkMode && styles.darkText]}>
          {difficulty.toUpperCase()} PROGRESS
        </Text>
        <TouchableOpacity onPress={onClose} style={[styles.closeButton, darkMode && styles.darkCloseButton]}>
          <Text style={[styles.closeText, darkMode && styles.darkCloseText]}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsSection, darkMode && styles.darkStatsSection]}>
        <Text style={[styles.statsText, darkMode && styles.darkStatsText]}>
          Progress: {completedCount}/{totalCount} ({Math.round((completedCount/totalCount) * 100)}%)
        </Text>
        <Text style={[styles.remainingText, darkMode && styles.darkRemainingText]}>
          {uncompletedWords.length} words remaining
        </Text>
      </View>

      {uncompletedWords.length > 0 && (
        <View style={[styles.section, darkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, { color }, darkMode && styles.darkSectionTitle]}>
            📝 Words You Haven&apos;t Seen Yet ({uncompletedWords.length}):
          </Text>
          {uncompletedWords.map((word, index) => (
            <View key={word.id} style={[styles.wordItem, darkMode && styles.darkWordItem]}>
              <Text style={[styles.wordNumber, darkMode && styles.darkWordNumber]}>{index + 1}.</Text>
              <View style={styles.wordContent}>
                <View style={styles.hindiRow}>
                  <Text style={[styles.hindiWord, darkMode && styles.darkHindiWord]}>{word.hindi}</Text>
                  <TouchableOpacity 
                    style={[styles.speakerButton, darkMode && styles.darkSpeakerButton]}
                    onPress={() => speakHindi(word.hindi)}
                  >
                    <Text style={styles.speakerIcon}>🔊</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.englishWord, darkMode && styles.darkEnglishWord]}>{word.english}</Text>
                {word.pronunciation && (
                  <Text style={[styles.pronunciation, darkMode && styles.darkPronunciation]}>({word.pronunciation})</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {completedWords.size > 0 && (
        <View style={[styles.section, darkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, { color }, darkMode && styles.darkSectionTitle]}>
            ✅ Completed Words ({completedWords.size}):
          </Text>
          {words.filter(word => completedWords.has(word.id)).map((word, index) => (
            <View key={word.id} style={[styles.wordItem, styles.completedItem, darkMode && styles.darkWordItem, darkMode && styles.darkCompletedItem]}>
              <Text style={[styles.wordNumber, darkMode && styles.darkWordNumber]}>{index + 1}.</Text>
              <View style={styles.wordContent}>
                <View style={styles.hindiRow}>
                  <Text style={[styles.hindiWord, darkMode && styles.darkHindiWord]}>{word.hindi}</Text>
                  <TouchableOpacity 
                    style={[styles.speakerButton, darkMode && styles.darkSpeakerButton]}
                    onPress={() => speakHindi(word.hindi)}
                  >
                    <Text style={styles.speakerIcon}>🔊</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.englishWord, darkMode && styles.darkEnglishWord]}>{word.english}</Text>
                {word.pronunciation && (
                  <Text style={[styles.pronunciation, darkMode && styles.darkPronunciation]}>({word.pronunciation})</Text>
                )}
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 50,
  },
  statsSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
    borderRadius: 8,
  },
  completedItem: {
    backgroundColor: '#E8F5E8',
    opacity: 0.8,
  },
  wordNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 12,
    minWidth: 24,
  },
  wordContent: {
    flex: 1,
  },
  hindiWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  englishWord: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  pronunciation: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // Dark mode styles
  darkContainer: {
    backgroundColor: '#111827',
  },
  darkHeader: {
    backgroundColor: '#374151',
    borderBottomColor: '#4B5563',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkCloseButton: {
    backgroundColor: '#4B5563',
  },
  darkCloseText: {
    color: '#D1D5DB',
  },
  darkStatsSection: {
    backgroundColor: '#374151',
  },
  darkStatsText: {
    color: '#F9FAFB',
  },
  darkRemainingText: {
    color: '#D1D5DB',
  },
  darkSection: {
    backgroundColor: '#374151',
  },
  darkSectionTitle: {
    color: '#F9FAFB',
  },
  darkWordItem: {
    backgroundColor: '#4B5563',
  },
  darkCompletedItem: {
    backgroundColor: '#065F46',
  },
  darkWordNumber: {
    color: '#D1D5DB',
  },
  darkHindiWord: {
    color: '#F9FAFB',
  },
  darkEnglishWord: {
    color: '#D1D5DB',
  },
  darkPronunciation: {
    color: '#9CA3AF',
  },
  darkLoadingText: {
    color: '#D1D5DB',
  },
  hindiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  speakerButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  darkSpeakerButton: {
    backgroundColor: '#6B7280',
  },
  speakerIcon: {
    fontSize: 14,
  },
});

WordProgress.displayName = 'WordProgress';

export default WordProgress;