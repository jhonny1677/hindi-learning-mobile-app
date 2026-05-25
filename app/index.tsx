
import React, { memo, useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView, Switch, Alert, Platform } from 'react-native';
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
import CredentialLogin from '../components/CredentialLogin';
import PrivacyPolicy from '../components/PrivacyPolicy';
import RewardNotification from '../components/RewardNotification';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { questManager } from '../utils/questManager';
import { notificationManager } from '../utils/notificationManager';
import { notificationService } from '../services/notificationService';

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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<'privacy' | 'terms'>('privacy');
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [streak, setStreak] = useState(0);
  const [realTimeStats, setRealTimeStats] = useState<{wordsLearned: number; studyTime: number; streak: number} | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'xp' | 'badge' | 'quest' | 'levelup';
    title: string;
    description: string;
    xpAmount?: number;
    iconName?: keyof typeof Ionicons.glyphMap;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  }>({
    visible: false,
    type: 'xp',
    title: '',
    description: '',
  });
  
  const { error, executeWithErrorHandling, clearError } = useErrorHandler();
  const { queueAction } = useOfflineMode();

  useEffect(() => {
    databaseService.init();
    
    // Setup notification manager callback
    notificationManager.setCallback(showNotification);
    
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

  // Reload real-time stats when social features are shown
  useEffect(() => {
    if (showSocial && currentUser) {
      loadRealTimeStats();
    }
  }, [showSocial]);

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
      try {
        // Check if user is logged in first
        const storedUser = await webStorage.getItem('hindi_learning_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          await handleAuthSuccess(user);
          return;
        }

        // Fall back to stored profile
        const stored = await webStorage.getItem('hindi_learning_profile');
        if (stored) {
          const profile: UserProfileData = JSON.parse(stored);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Clear potentially corrupted data
        await webStorage.removeItem('hindi_learning_user');
        await webStorage.removeItem('hindi_learning_profile');
      }
    }, 'Loading user profile');
  };

  const handleOnboardingComplete = async () => {
    try {
      await webStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setShowOnboarding(false);
      // Request notification permission and schedule daily reminder
      await notificationService.scheduleDailyReminder();
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

  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user);

    const profile: UserProfileData = {
      id: user.id || 'user_' + Date.now(),
      name: user.name || 'Learner',
      email: user.email,
      learningGoal: 'regular',
      nativeLanguage: 'English',
      hindiLevel: 'beginner',
      dailyGoalMinutes: 15,
      createdAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      totalWordsLearned: 0,
      totalStudyTime: 0,
      achievements: [],
      preferences: {
        notifications: true,
        soundEffects: true,
        darkMode: false,
        autoplay: true,
      },
    };

    setUserProfile(profile);

    // Load real-time stats after authentication
    await loadRealTimeStats();

    // Sync data when user signs in
    queueAction('profile', { user, timestamp: Date.now() });
  };

  const loadRealTimeStats = async () => {
    try {
      console.log('🔄 Loading real-time stats from storage...');
      const dailyStatsData = await webStorage.getItem('hindi_learning_daily_stats');
      console.log('🔄 Raw daily stats data:', dailyStatsData);
      
      if (dailyStatsData) {
        const dailyStats = JSON.parse(dailyStatsData);
        console.log('🔄 Parsed daily stats:', JSON.stringify(dailyStats));
        
        const newStats = {
          wordsLearned: dailyStats.wordsLearned || 0,
          studyTime: Math.floor((dailyStats.studyTimeMinutes || 0) * 60), // Convert minutes to seconds
          streak: dailyStats.streak || 0
        };
        console.log('🔄 Setting realTimeStats to:', JSON.stringify(newStats));
        setRealTimeStats(newStats);
      } else {
        console.log('🔄 No daily stats found, setting to zeros');
        setRealTimeStats({ wordsLearned: 0, studyTime: 0, streak: 0 });
      }
    } catch (error) {
      console.error('Error loading real-time stats:', error);
      setRealTimeStats({ wordsLearned: 0, studyTime: 0, streak: 0 });
    }
  };

  const showNotification = (
    type: 'xp' | 'badge' | 'quest' | 'levelup',
    title: string,
    description: string,
    xpAmount?: number,
    iconName?: string,
    rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  ) => {
    setNotification({
      visible: true,
      type,
      title,
      description,
      xpAmount,
      iconName: iconName as keyof typeof Ionicons.glyphMap | undefined,
      rarity,
    });
  };

  const getUserStats = () => {
    if (!userProfile && !currentUser) {
      return {
        streak: 0,
        wordsLearned: 0,
        studyTime: 0,
        level: 'beginner',
        name: 'Guest User',
      };
    }

    // Use real-time stats if available, otherwise use user profile data
    if (currentUser) {
      const stats = {
        streak: realTimeStats?.streak ?? streak ?? 0,
        wordsLearned: realTimeStats?.wordsLearned ?? userProfile?.totalWordsLearned ?? 0,
        studyTime: realTimeStats?.studyTime ?? userProfile?.totalStudyTime ?? 0,
        level: userProfile?.hindiLevel || 'beginner',
        name: userProfile?.name || currentUser.name || 'Learner',
      };
      return stats;
    }

    return {
      streak: streak || 0,
      wordsLearned: userProfile?.totalWordsLearned || 0,
      studyTime: userProfile?.totalStudyTime || 0,
      level: userProfile?.hindiLevel || 'beginner',
      name: userProfile?.name || 'Guest User',
    };
  };

  const difficulties = [
    { name: 'Beginner', key: 'beginner' as Difficulty, color: '#10B981', icon: '🌱', desc: 'Essential everyday words' },
    { name: 'Intermediate', key: 'intermediate' as Difficulty, color: '#F59E0B', icon: '🚀', desc: 'Expand your vocabulary' },
    { name: 'Advanced', key: 'advanced' as Difficulty, color: '#3B82F6', icon: '🎯', desc: 'Complex expressions' },
    { name: 'Expert', key: 'expert' as Difficulty, color: '#EF4444', icon: '👑', desc: 'Master-level Hindi' },
  ];

  const specialDecks = [
    { name: 'Alphabet', key: 'alphabet' as Difficulty, color: '#8B5CF6', icon: '🔤', desc: 'Learn Devanagari script' },
    { name: 'Grammar', key: 'grammar' as Difficulty, color: '#EC4899', icon: '📝', desc: 'Rules & sentence structure' },
  ];

  const isAdaptiveDifficulty = (d: Difficulty): d is 'beginner' | 'intermediate' | 'advanced' | 'expert' =>
    ['beginner', 'intermediate', 'advanced', 'expert'].includes(d);

  const startLearning = async (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);

    let word: Word | null = null;

    if (useAdaptiveLearning && isAdaptiveDifficulty(selectedDifficulty)) {
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
    await loadRealTimeStats();

    if (currentWord && difficulty) {
      let nextWord: Word | null = null;

      if (useAdaptiveLearning && isAdaptiveDifficulty(difficulty)) {
        nextWord = await databaseService.getAdaptiveDifficultyWord(difficulty);

        if (!nextWord) {
          const dueWords = await databaseService.getWordsDueForReview(difficulty);
          if (dueWords.length > 0) {
            nextWord = dueWords[Math.floor(Math.random() * dueWords.length)];
          }
        }
      }

      if (!nextWord) {
        nextWord = await databaseService.getRandomWord(difficulty);
      }

      if (nextWord) {
        setCurrentWord(nextWord);
      } else {
        setCompletionModal({ visible: true, difficulty });
        setIsLearning(false);
      }
    }
  };

  const handleIncorrect = async () => {
    if (currentWord && difficulty) {
      let nextWord: Word | null = null;

      if (useAdaptiveLearning && isAdaptiveDifficulty(difficulty)) {
        nextWord = await databaseService.getAdaptiveDifficultyWord(difficulty);

        if (!nextWord) {
          const dueWords = await databaseService.getWordsDueForReview(difficulty);
          if (dueWords.length > 0) {
            nextWord = dueWords[Math.floor(Math.random() * dueWords.length)];
          }
        }
      }

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


  const handleReset = () => {
    Alert.alert(
      'Reset All Progress',
      'Are you sure? This will erase all your learned words, streaks, XP, badges and quests. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllProgress();
              await webStorage.removeItem('hindi_learning_daily_stats');
              await webStorage.removeItem('hindi_learning_streak');
              await webStorage.removeItem('hindi_learning_xp');
              await webStorage.removeItem('hindi_learning_badges');
              await webStorage.removeItem('hindi_learning_quests');
              await webStorage.removeItem('hindi_learning_achievements');
              await webStorage.removeItem('hindi_learning_leaderboard');
              setCurrentWord(null);
              setDifficulty(null);
              setIsLearning(false);
              setIsQuizMode(false);
              setCompletionModal({ visible: false, difficulty: null });
              setQuizResults(null);
              setShowAnalytics(false);
              setShowWordProgress(null);
              setRealTimeStats({ wordsLearned: 0, studyTime: 0, streak: 0 });
              setStreak(0);
              Alert.alert('Done', 'All progress has been reset.');
            } catch (error) {
              console.error('Failed to reset progress:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
          },
        },
      ]
    );
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
                <Text style={[styles.title, darkMode && styles.darkText]}>Seekho Hindi</Text>
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
                  {currentUser ? '👤 Account' : '🔑 Sign In'}
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
              <TouchableOpacity
                key={diff.key}
                style={[styles.levelCard, darkMode && styles.darkLevelCard]}
                onPress={() => setShowWordProgress(diff.key)}
                activeOpacity={0.92}
              >
                <View style={[styles.levelCardAccent, { backgroundColor: diff.color }]} />
                <View style={styles.levelCardInner}>
                  <View style={styles.levelCardTop}>
                    <Text style={styles.levelCardIcon}>{diff.icon}</Text>
                    <View style={styles.levelCardMeta}>
                      <Text style={[styles.levelCardTitle, darkMode && styles.darkText]}>{diff.name}</Text>
                      <Text style={[styles.levelCardDesc, darkMode && styles.darkSubtitle]}>{diff.desc}</Text>
                    </View>
                  </View>
                  <CategoryStats difficulty={diff.key} onPress={(e) => { e?.stopPropagation?.(); setShowWordProgress(diff.key); }} />
                  <View style={styles.levelCardButtons}>
                    <TouchableOpacity
                      style={[styles.levelPlayBtn, { backgroundColor: diff.color }]}
                      onPress={(e) => { e.stopPropagation(); startLearning(diff.key); }}
                      accessibilityLabel={`Start ${diff.name} flashcards`}
                    >
                      <Text style={styles.levelPlayBtnText}>▶ Play</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.levelQuizBtn, { borderColor: diff.color }]}
                      onPress={(e) => { e.stopPropagation(); startQuiz(diff.key); }}
                      accessibilityLabel={`Start ${diff.name} quiz`}
                    >
                      <Text style={[styles.levelQuizBtnText, { color: diff.color }]}>Quiz</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Learning Decks */}
        <View style={styles.difficultiesSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Foundation Learning</Text>
          <View style={styles.difficultiesGrid}>
            {specialDecks.map((deck) => (
              <TouchableOpacity
                key={deck.key}
                style={[styles.levelCard, darkMode && styles.darkLevelCard]}
                onPress={() => setShowWordProgress(deck.key)}
                activeOpacity={0.92}
              >
                <View style={[styles.levelCardAccent, { backgroundColor: deck.color }]} />
                <View style={styles.levelCardInner}>
                  <View style={styles.levelCardTop}>
                    <Text style={styles.levelCardIcon}>{deck.icon}</Text>
                    <View style={styles.levelCardMeta}>
                      <Text style={[styles.levelCardTitle, darkMode && styles.darkText]}>{deck.name}</Text>
                      <Text style={[styles.levelCardDesc, darkMode && styles.darkSubtitle]}>{deck.desc}</Text>
                    </View>
                  </View>
                  <CategoryStats difficulty={deck.key} onPress={(e) => { e?.stopPropagation?.(); setShowWordProgress(deck.key); }} />
                  <View style={styles.levelCardButtons}>
                    <TouchableOpacity
                      style={[styles.levelPlayBtn, { backgroundColor: deck.color }]}
                      onPress={(e) => { e.stopPropagation(); startLearning(deck.key); }}
                      accessibilityLabel={`Start ${deck.name} flashcards`}
                    >
                      <Text style={styles.levelPlayBtnText}>▶ Play</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.levelQuizBtn, { borderColor: deck.color }]}
                      onPress={(e) => { e.stopPropagation(); startQuiz(deck.key); }}
                      accessibilityLabel={`Start ${deck.name} quiz`}
                    >
                      <Text style={[styles.levelQuizBtnText, { color: deck.color }]}>Quiz</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
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

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity onPress={() => { setPrivacyMode('privacy'); setShowPrivacy(true); }}>
            <Text style={[styles.legalLink, darkMode && styles.darkLegalLink]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.legalDot, darkMode && styles.darkLegalLink]}> · </Text>
          <TouchableOpacity onPress={() => { setPrivacyMode('terms'); setShowPrivacy(true); }}>
            <Text style={[styles.legalLink, darkMode && styles.darkLegalLink]}>Terms of Service</Text>
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

        <CredentialLogin
          visible={showAuth}
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        <PrivacyPolicy
          visible={showPrivacy}
          onClose={() => setShowPrivacy(false)}
          mode={privacyMode}
        />

        {/* Reward Notification */}
        <RewardNotification
          visible={notification.visible}
          onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
          type={notification.type}
          title={notification.title}
          description={notification.description}
          xpAmount={notification.xpAmount}
          iconName={notification.iconName}
          rarity={notification.rarity}
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
    marginBottom: 16,
  },
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 8,
  },
  legalLink: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 12,
    color: '#6B7280',
  },
  darkLegalLink: {
    color: '#9CA3AF',
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
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  darkLevelCard: {
    backgroundColor: '#1F2937',
  },
  levelCardAccent: {
    width: 5,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  levelCardInner: {
    flex: 1,
    padding: 14,
  },
  levelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelCardIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  levelCardMeta: {
    flex: 1,
  },
  levelCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  levelCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  levelCardButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  levelPlayBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  levelPlayBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  levelQuizBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  levelQuizBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default memo(App);
