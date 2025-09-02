import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Word } from '../database/database';
import { useSettings } from '../contexts/AppContext';

interface VirtualizedWordListProps {
  words: Word[];
  completedWords: Set<number>;
  loading?: boolean;
  onWordPress?: (word: Word) => void;
  estimatedItemSize?: number;
}

interface WordItemProps {
  word: Word;
  index: number;
  isCompleted: boolean;
  onPress?: (word: Word) => void;
}

// Memoized word item component for optimal performance
const WordItem = memo<WordItemProps>(({ word, index, isCompleted, onPress }) => {
  const { darkMode } = useSettings();
  
  const handlePress = useCallback(() => {
    onPress?.(word);
  }, [word, onPress]);
  
  const containerStyle = useMemo(() => [
    styles.wordItem,
    isCompleted && styles.completedItem,
    darkMode && styles.darkItem,
  ], [isCompleted, darkMode]);
  
  const textStyle = useMemo(() => [
    styles.hindiWord,
    darkMode && styles.darkText,
  ], [darkMode]);
  
  return (
    <View style={containerStyle}>
      <Text style={styles.wordNumber}>{index + 1}.</Text>
      <View style={styles.wordContent}>
        <Text style={textStyle}>{word.hindi}</Text>
        <Text style={[styles.englishWord, darkMode && styles.darkSecondaryText]}>
          {word.english}
        </Text>
        {word.pronunciation && (
          <Text style={[styles.pronunciation, darkMode && styles.darkSecondaryText]}>
            ({word.pronunciation})
          </Text>
        )}
      </View>
      {isCompleted && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
});

WordItem.displayName = 'WordItem';

const VirtualizedWordList: React.FC<VirtualizedWordListProps> = memo(({
  words,
  completedWords,
  loading = false,
  onWordPress,
  estimatedItemSize = 80,
}) => {
  const { darkMode } = useSettings();
  
  const renderItem: ListRenderItem<Word> = useCallback(({ item, index }) => (
    <WordItem
      word={item}
      index={index}
      isCompleted={completedWords.has(item.id)}
      onPress={onWordPress}
    />
  ), [completedWords, onWordPress]);
  
  const keyExtractor = useCallback((item: Word) => item.id.toString(), []);
  
  const getItemType = useCallback((item: Word, index: number) => {
    // Provide different types for completed vs incomplete items for better optimization
    return completedWords.has(item.id) ? 'completed' : 'incomplete';
  }, [completedWords]);
  
  const containerStyle = useMemo(() => [
    styles.container,
    darkMode && styles.darkContainer,
  ], [darkMode]);
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, darkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color={darkMode ? '#fff' : '#4F46E5'} />
        <Text style={[styles.loadingText, darkMode && styles.darkText]}>
          Loading words...
        </Text>
      </View>
    );
  }
  
  if (words.length === 0) {
    return (
      <View style={[styles.emptyContainer, darkMode && styles.darkContainer]}>
        <Text style={[styles.emptyText, darkMode && styles.darkText]}>
          No words found
        </Text>
      </View>
    );
  }
  
  return (
    <View style={containerStyle}>
      <FlashList
        data={words}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        estimatedItemSize={estimatedItemSize}
        // Performance optimizations
        removeClippedSubviews={true}
        // Styling
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Accessibility
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
});

VirtualizedWordList.displayName = 'VirtualizedWordList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  darkContainer: {
    backgroundColor: '#1F2937',
  },
  listContent: {
    padding: 16,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  darkItem: {
    backgroundColor: '#374151',
  },
  completedItem: {
    backgroundColor: '#E8F5E8',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  darkText: {
    color: '#F9FAFB',
  },
  englishWord: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  darkSecondaryText: {
    color: '#D1D5DB',
  },
  pronunciation: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

export default VirtualizedWordList;