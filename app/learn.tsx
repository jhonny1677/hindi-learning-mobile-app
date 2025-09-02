import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';
import { Word, databaseService } from '../database/database';
import { useAppContext } from '../contexts/AppContext';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export default function LearnScreen() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    setLoading,
    setProgressData,
    setDifficulty,
    setCurrentWord,
    setCompletionModal
  } = useAppContext();

  const loadWords = async (difficulty: Difficulty) => {
    try {
      setLoading(true);
      const data = await databaseService.getWordsByDifficulty(difficulty);
      setWords(data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Example: load beginner words initially
    loadWords('beginner');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Learning Screen</Text>
      {/* Example buttons */}
      <TouchableOpacity onPress={() => loadWords('intermediate')}>
        <Text>Load Intermediate</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', margin: 10 }
});
