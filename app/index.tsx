
import React, { memo, useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { webStorage } from '../utils/webStorage';

// Existing components
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WordProgress from '../components/WordProgress';
import CategoryStats from '../components/CategoryStats';
import CompletionModal from '../components/CompletionModal';
import Flashcard from '../components/Flashcard';
import Quiz from '../components/Quiz';
import QuizResults from '../components/QuizResults';
import { useAppContext } from '../contexts/AppContext';
import { databaseService, Word } from '../database/database';
import { offlineManager } from '../utils/offlineUtils';

// New feature components
import OnboardingTutorial from '../components/OnboardingTutorial';
import StreakTracker from '../components/StreakTracker';
import ErrorBoundary from '../components/ErrorBoundary';
import UserProfile, { UserProfileData } from '../components/UserProfile';
import OfflineIndicator from '../components/OfflineIndicator';
import SocialFeatures from '../components/SocialFeatures';
import QuestsAndBadges from '../components/QuestsAndBadges';
import GoogleAuth, { GoogleUser } from '../components/GoogleAuth';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useOfflineMode } from '../hooks/useOfflineMode';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'alphabet' | 'grammar';

const ONBOARDING_COMPLETE_KEY = 'hindi_learning_onboarding_complete';

const App = () => {
  const { 
    state, 
    setShowAnalytics, 
    setShowWordProgress, 
    setUseAdaptiveLearning,
    setCurrentWord,
    setDifficulty,
    setCompletionModal,
    setDarkMode,
    setIsQuizMode
  } = useAppContext();
  
  const { 
    showAnalytics, 
    showWordProgress, 
    useAdaptiveLearning, 
    currentWord, 
    difficulty,
    completionModal,
    darkMode,
    isQuizMode
  } = state;

  const [isLearning, setIsLearning] = useState(false);
  const [quizResults, setQuizResults] = useState<{ score: { correct: number; total: number }; difficulty: Difficulty } | null>(null);
  const [isOffline, setIsOffline] = useState(!offlineManager.getOnlineStatus());
  
  // New feature states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [streak, setStreak] = useState(0);
  
  const { error, executeWithErrorHandling, clearError } = useErrorHandler();
  const { queueAction } = useOfflineMode();

  useEffect(() => {
    databaseService.init();
    
    // Setup offline listener
    const offlineListener = (online: boolean) => {
      setIsOffline(!online);
    };
    
    offlineManager.addOfflineListener(offlineListener);
    
    // Check onboarding status and load user profile
    checkOnboardingStatus();
    loadUserProfile();
    
    return () => {
      offlineManager.removeOfflineListener(offlineListener);
    };
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await webStorage.getItem(ONBOARDING_COMPLETE_KEY);
      if (!completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const loadUserProfile = async () => {
    await executeWithErrorHandling(async () => {
      const stored = await webStorage.getItem('hindi_learning_profile');
      if (stored) {
        const profile: UserProfileData = JSON.parse(stored);
        setUserProfile(profile);
      }
    }, 'Loading user profile');
  };

  const handleOnboardingComplete = async () => {
    try {
      await webStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleProfileUpdate = (profile: UserProfileData) => {
    setUserProfile(profile);
    queueAction('profile', profile);
  };

  const handleStreakUpdate = (newStreak: number) => {
    setStreak(newStreak);
    queueAction('progress', { streak: newStreak, timestamp: Date.now() });
  };

  const handleGoogleAuthSuccess = (user: GoogleUser) => {
    setGoogleUser(user);
    // Sync data when user signs in
    queueAction('auth', { user, timestamp: Date.now() });
  };

  const getUserStats = () => {
    if (!userProfile) {
      return {
        streak: 0,
        wordsLearned: 0,
        studyTime: 0,
        level: 'beginner',
        name: 'Guest User',
      };
    }

    return {
      streak: streak || 0,
      wordsLearned: userProfile.totalWordsLearned,
      studyTime: userProfile.totalStudyTime,
      level: userProfile.hindiLevel,
      name: userProfile.name,
    };
  };

  const difficulties = [
    { name: 'Beginner', key: 'beginner' as Difficulty, color: '#10B981', icon: '🌱' },
    { name: 'Intermediate', key: 'intermediate' as Difficulty, color: '#F59E0B', icon: '🚀' },
    { name: 'Advanced', key: 'advanced' as Difficulty, color: '#3B82F6', icon: '🎯' },
    { name: 'Expert', key: 'expert' as Difficulty, color: '#EF4444', icon: '👑' },
  ];

  const specialDecks = [
    { name: 'Alphabet', key: 'alphabet' as Difficulty, color: '#8B5CF6', icon: '🔤' },
    { name: 'Grammar', key: 'grammar' as Difficulty, color: '#EC4899', icon: '📝' },
  ];

  const startLearning = async (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    
    let word: Word | null = null;
    
    if (useAdaptiveLearning) {
      // Try adaptive learning first
      word = await databaseService.getAdaptiveDifficultyWord(selectedDifficulty);
      
      // If no adaptive word found, try words due for review
      if (!word) {
        const dueWords = await databaseService.getWordsDueForReview(selectedDifficulty);
        if (dueWords.length > 0) {
          word = dueWords[Math.floor(Math.random() * dueWords.length)];
        }
      }
    }
    
    // Fallback to random word if adaptive learning is off or no adaptive word found
    if (!word) {
      word = await databaseService.getRandomWord(selectedDifficulty);
    }
    
    if (word) {
      setCurrentWord(word);
      setIsLearning(true);
    }
  };

  const handleCorrect = async () => {
    if (currentWord && difficulty) {
      let nextWord: Word | null = null;
      
      if (useAdaptiveLearning) {
        // Try adaptive learning for next word
        nextWord = await databaseService.getAdaptiveDifficultyWord(difficulty);
        
        // If no adaptive word found, try words due for review
        if (!nextWord) {
          const dueWords = await databaseService.getWordsDueForReview(difficulty);
          if (dueWords.length > 0) {
            nextWord = dueWords[Math.floor(Math.random() * dueWords.length)];
          }
        }
      }
      
      // Fallback to random word
      if (!nextWord) {
        nextWord = await databaseService.getRandomWord(difficulty);
      }
      
      if (nextWord) {
        setCurrentWord(nextWord);
      } else {
        // No more words, show completion
        setCompletionModal({ visible: true, difficulty });
        setIsLearning(false);
      }
    }
  };

  const handleIncorrect = async () => {
    if (currentWord && difficulty) {
      let nextWord: Word | null = null;
      
      if (useAdaptiveLearning) {
        // Try adaptive learning for next word
        nextWord = await databaseService.getAdaptiveDifficultyWord(difficulty);
        
        // If no adaptive word found, try words due for review
        if (!nextWord) {
          const dueWords = await databaseService.getWordsDueForReview(difficulty);
          if (dueWords.length > 0) {
            nextWord = dueWords[Math.floor(Math.random() * dueWords.length)];
          }
        }
      }
      
      // Fallback to random word
      if (!nextWord) {
        nextWord = await databaseService.getRandomWord(difficulty);
      }
      
      if (nextWord) {
        setCurrentWord(nextWord);
      }
    }
  };

  const handleCompletionCheck = (completedDifficulty: Difficulty) => {
    setCompletionModal({ visible: true, difficulty: completedDifficulty });
  };

  const startQuiz = async (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setIsQuizMode(true);
  };

  const handleQuizComplete = (score: { correct: number; total: number }) => {
    setQuizResults({ score, difficulty: difficulty! });
    setIsQuizMode(false);
  };

  const handleQuizRetry = () => {
    setQuizResults(null);
    if (difficulty) {
      startQuiz(difficulty);
    }
  };

  const handleQuizBack = () => {
    setQuizResults(null);
    setIsQuizMode(false);
    setDifficulty(null);
  };


  const handleReset = async () => {
    console.log('Reset button clicked!');
    
    // Use native confirm if available, otherwise provide fallback
    const shouldReset = window.confirm 
      ? window.confirm('Are you sure you want to reset all progress? This cannot be undone.')
      : true; // For debugging, auto-confirm if window.confirm is not available
    
    if (shouldReset) {
      try {
        console.log('Starting reset process...');
        
        // Clear all user progress from database
        await databaseService.clearAllProgress();
        console.log('Database progress cleared');
        
        // Reset all app state
        setCurrentWord(null);
        setDifficulty(null);
        setIsLearning(false);
        setIsQuizMode(false);
        setCompletionModal({ visible: false, difficulty: null });
        setQuizResults(null);
        setShowAnalytics(false);
        setShowWordProgress(null);
        console.log('App state reset');
        
        // Force a page reload to completely reset the state
        if (typeof window !== 'undefined' && window.location) {
          window.location.reload();
        }
        
        // Show success message (if page doesn't reload)
        if (window.alert) {
          window.alert('All progress has been reset!');
        } else {
          console.log('All progress has been reset!');
        }
      } catch (error) {
        console.error('Failed to reset progress:', error);
        if (window.alert) {
          window.alert('Failed to reset progress. Please try again.');
        }
      }
    } else {
      console.log('Reset cancelled by user');
    }
  };

  if (showAnalytics) {
    return (
      <SafeAreaView style={styles.container}>
        <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
      </SafeAreaView>
    );
  }

  if (showWordProgress) {
    return (
      <SafeAreaView style={styles.container}>
        <WordProgress
          difficulty={showWordProgress}
          onClose={() => setShowWordProgress(null)}
        />
      </SafeAreaView>
    );
  }

  if (quizResults) {
    return (
      <SafeAreaView style={styles.container}>
        <QuizResults
          score={quizResults.score}
          difficulty={quizResults.difficulty}
          onRetry={handleQuizRetry}
          onBack={handleQuizBack}
        />
      </SafeAreaView>
    );
  }

  if (isQuizMode && difficulty) {
    return (
      <SafeAreaView style={styles.container}>
        <Quiz
          difficulty={difficulty}
          onComplete={handleQuizComplete}
          onBack={handleQuizBack}
        />
      </SafeAreaView>
    );
  }

  if (isLearning && currentWord) {
    return (
      <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <TouchableOpacity 
            style={[styles.backButton, darkMode && styles.darkBackButton]}
            onPress={() => setIsLearning(false)}
          >
            <Text style={[styles.backButtonText, darkMode && styles.darkText]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.difficultyText, darkMode && styles.darkDifficultyText]}>
            {difficulty?.toUpperCase()}
          </Text>
        </View>
        <Flashcard
          word={currentWord}
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          onCompletionCheck={handleCompletionCheck}
        />
        <CompletionModal
          visible={completionModal.visible}
          difficulty={completionModal.difficulty}
          onClose={() => setCompletionModal({ visible: false, difficulty: null })}
          onContinue={() => {
            setCompletionModal({ visible: false, difficulty: null });
            if (completionModal.difficulty) {
              startLearning(completionModal.difficulty);
            }
          }}
        />
      </SafeAreaView>
    );
  }

  // Main Home UI
  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
        <OfflineIndicator />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header with Profile */}
          <View style={[styles.headerSection, darkMode && styles.darkHeaderSection]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.title, darkMode && styles.darkText]}>Hindi Learning App</Text>
                <Text style={[styles.subtitle, darkMode && styles.darkSubtitle]}>
                  Welcome back, {userProfile?.name || 'Learner'}!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => setShowProfile(true)}
              >
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {userProfile?.name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Top Buttons */}
            <View style={styles.topButtons}>
              <TouchableOpacity 
                style={[styles.topButton, { backgroundColor: darkMode ? '#374151' : '#F3F4F6' }]}
                onPress={() => setDarkMode(!darkMode)}
              >
                <Text style={[styles.topButtonText, { color: darkMode ? '#F9FAFB' : '#111827' }]}>
                  {darkMode ? '🌙' : '☀️'} {darkMode ? 'Dark' : 'Light'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.topButton, { backgroundColor: useAdaptiveLearning ? '#10B981' : '#6B7280' }]}
                onPress={() => setUseAdaptiveLearning(!useAdaptiveLearning)}
              >
                <Text style={styles.topButtonText}>
                  🤖 AI {useAdaptiveLearning ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.topButton}
                onPress={() => setShowAnalytics(true)}
              >
                <Text style={styles.topButtonText}>📊 Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.topButton}
                onPress={() => setShowSocial(true)}
              >
                <Text style={styles.topButtonText}>👥 Social</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.topButton}
                onPress={() => setShowQuests(true)}
              >
                <Text style={styles.topButtonText}>🏆 Quests</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.topButton}
                onPress={() => setShowAuth(true)}
              >
                <Text style={styles.topButtonText}>
                  {googleUser ? '👤 Account' : '🔑 Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.topButton}
                onPress={() => setShowOnboarding(true)}
              >
                <Text style={styles.topButtonText}>❓ Help</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Streak Tracker */}
          <StreakTracker onStreakUpdate={handleStreakUpdate} />

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, darkMode && styles.darkErrorContainer]}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorTitle}>Error Occurred</Text>
                <TouchableOpacity onPress={clearError}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.errorMessage}>{error.message}</Text>
              <Text style={styles.errorContext}>
                Severity: {error.severity} | Context: {error.context || 'None'}
              </Text>
            </View>
          )}

        {/* Difficulty Level Cards */}
        <View style={styles.difficultiesSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Choose Your Level</Text>
          <View style={styles.difficultiesGrid}>
            {difficulties.map((diff) => (
              <View key={diff.key} style={styles.cardGroup}>
                {/* Main Learning Card */}
                <View
                  style={[
                    styles.difficultyCard, 
                    { borderLeftColor: diff.color },
                    darkMode && styles.darkCard
                  ]}
                >
                  <Text style={styles.cardIcon}>{diff.icon}</Text>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, darkMode && styles.darkText]}>{diff.name}</Text>
                    <CategoryStats 
                      difficulty={diff.key} 
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        setShowWordProgress(diff.key);
                      }}
                    />
                  </View>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.playButton, { backgroundColor: diff.color }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        startLearning(diff.key);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Play</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.quizButton, { backgroundColor: diff.color, opacity: 0.8 }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        startQuiz(diff.key);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Quiz</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Special Learning Decks */}
        <View style={styles.difficultiesSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Foundation Learning</Text>
          <View style={styles.difficultiesGrid}>
            {specialDecks.map((deck) => (
              <View key={deck.key} style={styles.cardGroup}>
                {/* Special Learning Card */}
                <View
                  style={[
                    styles.difficultyCard, 
                    { borderLeftColor: deck.color },
                    darkMode && styles.darkCard
                  ]}
                >
                  <Text style={styles.cardIcon}>{deck.icon}</Text>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, darkMode && styles.darkText]}>{deck.name}</Text>
                    <CategoryStats 
                      difficulty={deck.key} 
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        setShowWordProgress(deck.key);
                      }}
                    />
                  </View>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.playButton, { backgroundColor: deck.color }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        startLearning(deck.key);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Play</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.quizButton, { backgroundColor: deck.color, opacity: 0.8 }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        startQuiz(deck.key);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Quiz</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Reset Button */}
        <View style={styles.resetSection}>
          <TouchableOpacity 
            style={[styles.resetButton, darkMode && styles.darkResetButton]}
            onPress={handleReset}
          >
            <Text style={[styles.resetButtonText, darkMode && styles.darkText]}>🔄 Reset All Progress</Text>
          </TouchableOpacity>
        </View>

        </ScrollView>
        
        {/* Modals */}
        <OnboardingTutorial
          visible={showOnboarding}
          onComplete={handleOnboardingComplete}
        />

        <UserProfile
          visible={showProfile}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={handleProfileUpdate}
        />

        <SocialFeatures
          visible={showSocial}
          onClose={() => setShowSocial(false)}
          userStats={getUserStats()}
        />

        <QuestsAndBadges
          visible={showQuests}
          onClose={() => setShowQuests(false)}
          userStats={getUserStats()}
        />

        <GoogleAuth
          visible={showAuth}
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleGoogleAuthSuccess}
        />
      </SafeAreaView>
    </ErrorBoundary>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerSection: {
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  darkHeaderSection: {
    backgroundColor: '#374151',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  darkSubtitle: {
    color: '#D1D5DB',
  },
  topButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  darkErrorContainer: {
    backgroundColor: '#7F1D1D',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    flex: 1,
    marginLeft: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  errorContext: {
    fontSize: 12,
    color: '#6B7280',
  },
  topButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  difficultiesSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  difficultiesGrid: {
    gap: 12,
  },
  difficultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardGroup: {
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  darkText: {
    color: '#F9FAFB',
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  playButton: {
    // Main play button gets full color
  },
  quizButton: {
    // Quiz button gets slightly transparent
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  resetSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  resetButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  darkResetButton: {
    backgroundColor: '#7F1D1D',
    borderColor: '#DC2626',
  },
  resetButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  darkHeader: {
    backgroundColor: '#374151',
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
    fontSize: 16,
    fontWeight: '500',
  },
  difficultyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  darkDifficultyText: {
    color: '#A78BFA',
  },
  offlineIndicator: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  darkOfflineIndicator: {
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default memo(App);
