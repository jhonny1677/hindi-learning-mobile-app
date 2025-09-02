import React, { useState, memo, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated 
} from 'react-native';
import * as Haptics from '../services/hapticService';
import { Word, databaseService } from '../database/database';
import { useSettings, useAppContext } from '../contexts/AppContext';
import { speakHindi } from '../utils/speechUtils';
import { analyticsManager } from '../utils/analyticsUtils';
import { questManager } from '../utils/questManager';
import { notificationManager } from '../utils/notificationManager';

interface FlashcardProps {
  word: Word;
  onCorrect: () => void;
  onIncorrect: () => void;
  onCompletionCheck?: (difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert') => void;
}

const { width } = Dimensions.get('window');

const Flashcard = memo<FlashcardProps>(function Flashcard({ word, onCorrect, onIncorrect, onCompletionCheck }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [startTime, setStartTime] = useState<number>(Date.now());

  const { hapticFeedback } = useSettings();
  const { state } = useAppContext();
  const { darkMode } = state;

  // Reset flip state when word changes
  useEffect(() => {
    setIsFlipped(false);
    flipAnimation.setValue(0);
    setStartTime(Date.now());
  }, [word.id, flipAnimation]);

  const flipCard = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isFlipped) {
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Reset timer when card is flipped to reveal answer
      setStartTime(Date.now());
    }
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnimation, hapticFeedback]);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const handleCorrect = async () => {
    const responseTime = Date.now() - startTime;
    await databaseService.updateProgressWithSRS(word.id, true, responseTime);
    
    // Track quest progress and XP gains (sequentially to avoid race conditions)
    console.log('📚 Tracking word learned...');
    const wordResult = await questManager.trackWordLearned();
    const correctResult = await questManager.trackCorrectAnswer();
    const studyResult = await questManager.trackStudyTime(1); // 1 minute of study time per word
    const questResults = [wordResult, correctResult, studyResult];
    console.log('📚 Quest results:', questResults);
    
    // Show XP gain notification for base correct answer XP
    notificationManager.showXPGain(10, 'Correct answer!');
    
    // Trigger real-time analytics update
    analyticsManager.triggerAnalyticsUpdate();
    
    onCorrect();
    
    // Check if this completion triggers a level completion
    if (onCompletionCheck) {
      const progress = await databaseService.getDifficultyProgress(word.difficulty);
      if (progress.isComplete) {
        onCompletionCheck(word.difficulty);
      }
    }
    
    // Reset timer for next card
    setStartTime(Date.now());
  };

  const handleIncorrect = async () => {
    const responseTime = Date.now() - startTime;
    await databaseService.updateProgressWithSRS(word.id, false, responseTime);
    
    // Still track study time even for incorrect answers
    await questManager.trackStudyTime(0.5); // Half a minute for incorrect
    
    // Trigger real-time analytics update
    analyticsManager.triggerAnalyticsUpdate();
    
    onIncorrect();
    
    // Reset timer for next card
    setStartTime(Date.now());
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <TouchableOpacity onPress={flipCard} style={styles.cardContainer}>
        <Animated.View style={[styles.card, darkMode ? styles.darkCardFront : styles.cardFront, frontAnimatedStyle]}>
          <Text style={styles.cardLabel}>Hindi Word</Text>
          <View style={styles.hindiContainer}>
            <Text style={styles.hindiText}>{word.hindi}</Text>
            {!isFlipped && (
              <TouchableOpacity 
                style={styles.speakerButton}
                onPress={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  speakHindi(word.hindi);
                  return false;
                }}
                activeOpacity={0.5}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.speakerIcon}>🔊</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.difficultyTag}>{word.difficulty.toUpperCase()}</Text>
          <Text style={styles.tapHint}>👆 Tap to reveal English meaning</Text>
        </Animated.View>
        
        <Animated.View style={[styles.card, darkMode ? styles.darkCardBack : styles.cardBack, backAnimatedStyle]}>
          <Text style={styles.cardLabel}>English Meaning</Text>
          <Text style={styles.englishText}>{word.english}</Text>
          {word.pronunciation && (
            <Text style={styles.pronunciationText}>
              Pronunciation: {word.pronunciation}
            </Text>
          )}
          <Text style={styles.tapHint}>👆 Tap to flip back to Hindi</Text>
        </Animated.View>
      </TouchableOpacity>

      {isFlipped && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.incorrectButton]} 
            onPress={handleIncorrect}
          >
            <Text style={styles.buttonText}>❌ Didn&apos;t Know</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.correctButton]} 
            onPress={handleCorrect}
          >
            <Text style={styles.buttonText}>✅ Got It!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F0F4F8',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  cardContainer: {
    width: Math.min(width * 0.9, 400), // Max width of 400px, 90% of screen
    height: 350, // Increased height
    marginBottom: 30,
    alignSelf: 'center', // Center the card
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#4F46E5',
  },
  darkCardFront: {
    backgroundColor: '#6366F1',
  },
  cardBack: {
    backgroundColor: '#059669',
  },
  darkCardBack: {
    backgroundColor: '#10B981',
  },
  cardLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hindiText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  englishText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  pronunciationText: {
    fontSize: 18,
    color: '#E5E7EB',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  difficultyTag: {
    fontSize: 14,
    color: '#E5E7EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  tapHint: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: Math.min(width * 0.9, 400), // Match card container width
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctButton: {
    backgroundColor: '#10B981',
  },
  incorrectButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  hindiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  speakerButton: {
    marginLeft: 15,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    elevation: 10,
    zIndex: 1000,
    minWidth: 50,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  speakerIcon: {
    fontSize: 22,
    color: '#4F46E5',
  },
});

export default Flashcard;