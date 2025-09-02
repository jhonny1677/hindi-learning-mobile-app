import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Word, databaseService } from '../database/database';
import { useAppContext } from '../contexts/AppContext';

interface QuizProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  onComplete: (score: { correct: number; total: number }) => void;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

const Quiz: React.FC<QuizProps> = ({ difficulty, onComplete, onBack }) => {
  const { state, setQuizWords, setCurrentQuizIndex, resetQuizScore, updateQuizScore, setQuizOptions } = useAppContext();
  const { quizWords, currentQuizIndex, quizScore, quizOptions, darkMode } = state;
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    initializeQuiz();
  }, [difficulty]);

  const initializeQuiz = async () => {
    try {
      // Ensure database is initialized
      await databaseService.init();
      
      const words = await databaseService.getWordsByDifficulty(difficulty);
      console.log(`Found ${words.length} words for difficulty: ${difficulty}`);
      
      if (words.length === 0) {
        console.error(`No words found for difficulty: ${difficulty}`);
        return;
      }
      
      // Get 30 random words for the quiz (or all available if less than 30)
      const numQuestions = Math.min(words.length, 30);
      const shuffledWords = words.sort(() => 0.5 - Math.random()).slice(0, numQuestions);
      
      setQuizWords(shuffledWords);
      setCurrentQuizIndex(0);
      resetQuizScore();
      
      if (shuffledWords.length > 0) {
        await generateOptions(shuffledWords[0], words);
      }
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
    }
  };

  const generateOptions = async (currentWord: Word, allWords: Word[]) => {
    // Get incorrect options from other words
    const otherWords = allWords.filter(w => w.id !== currentWord.id);
    
    // If we don't have enough words from the same difficulty, get from all difficulties
    if (otherWords.length < 3) {
      const allAvailableWords = await databaseService.getAllWords();
      const filteredWords = allAvailableWords.filter(w => w.id !== currentWord.id && w.english !== currentWord.english);
      const shuffledOthers = filteredWords.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const options = [currentWord.english, ...shuffledOthers.map(w => w.english)];
      const shuffledOptions = options.sort(() => 0.5 - Math.random());
      setQuizOptions(shuffledOptions);
    } else {
      // Normal case: enough words from same difficulty
      const shuffledOthers = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [currentWord.english, ...shuffledOthers.map(w => w.english)];
      const shuffledOptions = options.sort(() => 0.5 - Math.random());
      setQuizOptions(shuffledOptions);
    }
  };

  const handleOptionSelect = async (option: string) => {
    if (selectedOption || showResult) return;
    
    setSelectedOption(option);
    const correct = option === quizWords[currentQuizIndex].english;
    setIsCorrect(correct);
    setShowResult(true);
    
    updateQuizScore(correct);
    
    // Auto advance after 1.5 seconds
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = async () => {
    if (!quizWords || currentQuizIndex >= quizWords.length - 1) {
      // Quiz completed - use final score
      onComplete(quizScore);
      return;
    }
    
    const nextIndex = currentQuizIndex + 1;
    setCurrentQuizIndex(nextIndex);
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
    
    // Generate options for next word
    try {
      const allWords = await databaseService.getWordsByDifficulty(difficulty);
      if (quizWords[nextIndex]) {
        await generateOptions(quizWords[nextIndex], allWords);
      }
    } catch (error) {
      console.error('Error generating options for next question:', error);
    }
  };

  if (!quizWords || quizWords.length === 0) {
    return (
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <Text style={[styles.loadingText, darkMode && styles.darkText]}>Loading quiz...</Text>
      </View>
    );
  }

  const currentWord = quizWords[currentQuizIndex];
  if (!currentWord) {
    return (
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <Text style={[styles.loadingText, darkMode && styles.darkText]}>Loading question...</Text>
      </View>
    );
  }

  const progress = `${currentQuizIndex + 1} / ${quizWords.length}`;

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <TouchableOpacity style={[styles.backButton, darkMode && styles.darkBackButton]} onPress={onBack}>
          <Text style={[styles.backButtonText, darkMode && styles.darkText]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.progressText, darkMode && styles.darkText]}>Quiz {progress}</Text>
        <Text style={[styles.scoreText, darkMode && styles.darkText]}>
          Score: {quizScore.correct}/{quizScore.total}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={[styles.questionLabel, darkMode && styles.darkText]}>What does this Hindi word mean?</Text>
        <Text style={[styles.hindiWord, darkMode && styles.darkText]}>{currentWord.hindi}</Text>
        <Text style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(difficulty) }]}>
          {difficulty.toUpperCase()}
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {(quizOptions || []).map((option, index) => {
          let buttonStyle = [styles.optionButton, darkMode && styles.darkOptionButton];
          let textStyle = [styles.optionText, darkMode && styles.darkText];
          
          if (showResult && selectedOption) {
            if (option === currentWord.english) {
              // Correct answer - always green
              buttonStyle.push(styles.correctOption);
              textStyle.push(styles.correctOptionText);
            } else if (option === selectedOption) {
              // Selected wrong answer - red
              buttonStyle.push(styles.incorrectOption);
              textStyle.push(styles.incorrectOptionText);
            } else {
              // Other options - dimmed
              buttonStyle.push(styles.dimmedOption);
              textStyle.push(styles.dimmedOptionText);
            }
          }
          
          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleOptionSelect(option)}
              disabled={showResult}
            >
              <Text style={textStyle}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Result feedback */}
      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.incorrectText]}>
            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
          </Text>
          {currentWord.pronunciation && (
            <Text style={[styles.pronunciationText, darkMode && styles.darkText]}>
              Pronunciation: {currentWord.pronunciation}
            </Text>
          )}
        </View>
      )}
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
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  darkHeader: {
    backgroundColor: '#374151',
    borderBottomColor: '#4B5563',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  darkBackButton: {
    backgroundColor: '#4B5563',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scoreText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  questionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  questionLabel: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  hindiWord: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  difficultyTag: {
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkOptionButton: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  correctOption: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  correctOptionText: {
    color: '#047857',
  },
  incorrectOption: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  incorrectOptionText: {
    color: '#DC2626',
  },
  dimmedOption: {
    opacity: 0.5,
  },
  dimmedOptionText: {
    color: '#9CA3AF',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctText: {
    color: '#10B981',
  },
  incorrectText: {
    color: '#EF4444',
  },
  pronunciationText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 100,
  },
  darkText: {
    color: '#F9FAFB',
  },
});

export default Quiz;