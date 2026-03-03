
import React, { memo, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import ExploreScreen from './(tabs)/explore';
import RewardNotification from '../components/RewardNotification';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { questManager } from '../utils/questManager';
import { notificationManager } from '../utils/notificationManager';

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
  const [activeTab, setActiveTab] = useState<'home' | 'levels' | 'phrases' | 'profile'>('home');
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

    notificationManager.setCallback(showNotification);

    const offlineListener = (online: boolean) => {
      setIsOffline(!online);
    };
    offlineManager.addOfflineListener(offlineListener);

    checkOnboardingStatus();
    loadUserProfile();
    loadSavedDarkMode();

    (async () => {
      try {
        const mod = await import('../services/notificationService');
        mod.notificationService.initialize();
      } catch (e) {
        console.log('Notifications not available in Expo Go');
      }
    })();

    return () => {
      offlineManager.removeOfflineListener(offlineListener);
    };
  }, []);

  const loadSavedDarkMode = async () => {
    const saved = await webStorage.getItem('hindi_learning_dark_mode');
    if (saved === 'true') setDarkMode(true);
  };


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
      try {
        const mod = await import('../services/notificationService');
        await mod.notificationService.scheduleDailyReminder();
      } catch (e) {
        console.log('Notifications not available in Expo Go');
      }
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

    // Preserve any previously saved profile so cumulative stats survive reloads.
    let existing: UserProfileData | null = null;
    try {
      const stored = await webStorage.getItem('hindi_learning_profile');
      if (stored) existing = JSON.parse(stored);
    } catch {}

    const profile: UserProfileData = {
      id: user.id || existing?.id || 'user_' + Date.now(),
      name: user.name || existing?.name || 'Learner',
      email: user.email,
      learningGoal: existing?.learningGoal ?? 'regular',
      nativeLanguage: existing?.nativeLanguage ?? 'English',
      hindiLevel: existing?.hindiLevel ?? 'beginner',
      dailyGoalMinutes: existing?.dailyGoalMinutes ?? 15,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      totalWordsLearned: existing?.totalWordsLearned ?? 0,
      totalStudyTime: existing?.totalStudyTime ?? 0,
      achievements: existing?.achievements ?? [],
      preferences: existing?.preferences ?? {
        notifications: true,
        soundEffects: true,
        darkMode: false,
        autoplay: true,
      },
    };

    setUserProfile(profile);
    await loadRealTimeStats();
    queueAction('profile', { user, timestamp: Date.now() });
  };

  const loadRealTimeStats = async () => {
    try {
      const dailyStatsData = await webStorage.getItem('hindi_learning_daily_stats');
      if (dailyStatsData) {
        const dailyStats = JSON.parse(dailyStatsData);
        setRealTimeStats({
          wordsLearned: dailyStats.wordsLearned || 0,
          studyTime: Math.floor((dailyStats.studyTimeMinutes || 0) * 60),
          streak: dailyStats.streak || 0,
        });
      } else {
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
    { name: 'Grammar', key: 'grammar' as Difficulty, color: '#EC4899', icon: '📖', desc: 'Rules & sentence structure' },
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


  const doReset = async () => {
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
      if (Platform.OS === 'web') {
        window.alert('All progress has been reset.');
      } else {
        Alert.alert('Done', 'All progress has been reset.');
      }
    } catch (error) {
      console.error('Failed to reset progress:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to reset progress. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to reset progress. Please try again.');
      }
    }
  };

  const handleReset = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Reset All Progress\n\nThis will erase all your learned words, streaks, XP, badges and quests. This cannot be undone.')) {
        doReset();
      }
    } else {
      Alert.alert(
        'Reset All Progress',
        'Are you sure? This will erase all your learned words, streaks, XP, badges and quests. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await webStorage.removeItem('hindi_learning_user');
      setCurrentUser(null);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of your account?')) doLogout();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
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
            <Text style={styles.backButtonText}>← Back</Text>
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

  // ─── Main tabbed UI ───
  const heroGradientStyle = Platform.OS === 'web'
    ? { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' } as any
    : { backgroundColor: '#4F46E5' };

  const userStats = getUserStats();
  const bg = (light: string, dark: string) => (darkMode ? dark : light);

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
        <OfflineIndicator />

        {/* ── Top Header ── */}
        <View style={[styles.topHeader, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderBottomColor: bg('#E5E7EB', '#374151') }]}>
          <Text style={[styles.appTitle, { color: bg('#1F2937', '#F9FAFB') }]}>Seekho Hindi</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={async () => {
                const next = !darkMode;
                setDarkMode(next);
                await webStorage.setItem('hindi_learning_dark_mode', next.toString());
              }}
              style={styles.headerIconBtn}
            >
              <Ionicons
                name={darkMode ? 'sunny-outline' : 'moon-outline'}
                size={22}
                color={bg('#1F2937', '#F9FAFB')}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('profile')}
              style={styles.headerIconBtn}
            >
              <Ionicons name="person-circle-outline" size={26} color={bg('#1F2937', '#F9FAFB')} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tab Content ── */}
        <ScrollView
          key={activeTab}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: bg('#F5F7FA', '#111827') }]}
        >
          {/* ── HOME TAB ── */}
          {activeTab === 'home' && (
            <>
              {/* Hero card */}
              <View style={[styles.heroCard, heroGradientStyle]}>
                <Text style={styles.heroGreeting}>Namaste! 🙏</Text>
                <Text style={styles.heroSubtitle}>Keep up your Hindi learning streak</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatNumber}>{userStats.wordsLearned}</Text>
                    <Text style={styles.heroStatLabel}>Words Learned</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatNumber}>{userStats.streak}</Text>
                    <Text style={styles.heroStatLabel}>Day Streak</Text>
                  </View>
                </View>
              </View>

              {/* Error display */}
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

              <StreakTracker onStreakUpdate={handleStreakUpdate} />

              {/* Start Learning CTA */}
              <View style={[styles.ctaCard, { backgroundColor: bg('#EDE9FE', '#2E1065') }]}>
                <Text style={[styles.ctaTitle, { color: bg('#4F46E5', '#C4B5FD') }]}>Ready to learn? 🚀</Text>
                <Text style={[styles.ctaSubtitle, { color: bg('#6D28D9', '#A78BFA') }]}>Continue with Beginner level</Text>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => setActiveTab('levels')}
                  accessibilityLabel="Start a learning session"
                >
                  <Text style={styles.ctaButtonText}>Start Session →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── LEVELS TAB ── */}
          {activeTab === 'levels' && (
            <View style={styles.levelsSection}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff.key}
                  style={[styles.levelCard, darkMode && styles.darkLevelCard]}
                  onPress={() => setShowWordProgress(diff.key)}
                  activeOpacity={0.92}
                >
                  <View style={styles.levelCardInner}>
                    <View style={styles.levelCardTop}>
                      <Text style={styles.levelCardIcon}>{diff.icon}</Text>
                      <View style={styles.levelCardMeta}>
                        <Text style={[styles.levelCardTitle, darkMode && styles.darkText]}>{diff.name}</Text>
                        <Text style={[styles.levelCardDesc, darkMode && styles.darkSubtitle]}>{diff.desc}</Text>
                      </View>
                    </View>
                    <CategoryStats difficulty={diff.key} color={diff.color} />
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

              {/* Foundation divider pill */}
              <View style={styles.dividerPill}>
                <Text style={styles.dividerPillText}>Foundation</Text>
              </View>

              {specialDecks.map((deck) => (
                <TouchableOpacity
                  key={deck.key}
                  style={[styles.levelCard, darkMode && styles.darkLevelCard]}
                  onPress={() => setShowWordProgress(deck.key)}
                  activeOpacity={0.92}
                >
                  <View style={styles.levelCardInner}>
                    <View style={styles.levelCardTop}>
                      <Text style={styles.levelCardIcon}>{deck.icon}</Text>
                      <View style={styles.levelCardMeta}>
                        <Text style={[styles.levelCardTitle, darkMode && styles.darkText]}>{deck.name}</Text>
                        <Text style={[styles.levelCardDesc, darkMode && styles.darkSubtitle]}>{deck.desc}</Text>
                      </View>
                    </View>
                    <CategoryStats difficulty={deck.key} color={deck.color} />
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
          )}

          {/* ── PHRASES TAB ── */}
          {activeTab === 'phrases' && (
            <ExploreScreen />
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <View style={styles.profileSection}>
              {/* Profile info card */}
              <View style={[styles.profileCard, { backgroundColor: bg('#FFFFFF', '#1F2937') }]}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileAvatarLargeText}>
                    {userStats.name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={[styles.profileName, { color: bg('#1F2937', '#F9FAFB') }]}>
                  {userStats.name}
                </Text>
                <Text style={[styles.profileLevel, { color: bg('#6B7280', '#9CA3AF') }]}>
                  Level: {userStats.level}
                </Text>
              </View>

              {/* Stats badges row */}
              <View style={[styles.statsBadgesRow, { backgroundColor: bg('#FFFFFF', '#1F2937') }]}>
                <View style={styles.statBadge}>
                  <Text style={[styles.statBadgeNumber, { color: '#4F46E5' }]}>{userStats.wordsLearned}</Text>
                  <Text style={[styles.statBadgeLabel, { color: bg('#6B7280', '#9CA3AF') }]}>Words</Text>
                </View>
                <View style={[styles.statBadgeDivider, { backgroundColor: bg('#E5E7EB', '#374151') }]} />
                <View style={styles.statBadge}>
                  <Text style={[styles.statBadgeNumber, { color: '#F97316' }]}>{userStats.streak}</Text>
                  <Text style={[styles.statBadgeLabel, { color: bg('#6B7280', '#9CA3AF') }]}>Streak</Text>
                </View>
                <View style={[styles.statBadgeDivider, { backgroundColor: bg('#E5E7EB', '#374151') }]} />
                <View style={styles.statBadge}>
                  <Text style={[styles.statBadgeNumber, { color: '#10B981' }]}>{Math.floor(userStats.studyTime / 60)}</Text>
                  <Text style={[styles.statBadgeLabel, { color: bg('#6B7280', '#9CA3AF') }]}>Min Studied</Text>
                </View>
              </View>

              {/* Feature rows */}
              {([
                { icon: 'person-outline', label: 'Edit Profile', onPress: () => setShowProfile(true) },
                { icon: 'bar-chart-outline', label: 'Analytics', onPress: () => setShowAnalytics(true) },
                { icon: 'trophy-outline', label: 'Quests & Badges', onPress: () => setShowQuests(true) },
                { icon: 'people-outline', label: 'Social', onPress: async () => { await loadRealTimeStats(); setShowSocial(true); } },
                { icon: 'help-circle-outline', label: 'Help & Tutorial', onPress: () => setShowOnboarding(true) },
                { icon: 'document-text-outline', label: 'Privacy Policy', onPress: () => { setPrivacyMode('privacy'); setShowPrivacy(true); } },
                { icon: 'reader-outline', label: 'Terms of Service', onPress: () => { setPrivacyMode('terms'); setShowPrivacy(true); } },
              ] as const).map((row) => (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.featureRow, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderBottomColor: bg('#F3F4F6', '#374151') }]}
                  onPress={row.onPress}
                >
                  <Ionicons name={row.icon as any} size={20} color={bg('#4F46E5', '#A78BFA')} />
                  <Text style={[styles.featureRowLabel, { color: bg('#1F2937', '#F9FAFB') }]}>{row.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={bg('#9CA3AF', '#6B7280')} />
                </TouchableOpacity>
              ))}

              {/* Sign in / Sign out */}
              {currentUser && currentUser.loginMethod !== 'guest' ? (
                <TouchableOpacity
                  style={[styles.featureRow, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderBottomColor: bg('#F3F4F6', '#374151') }]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  <Text style={[styles.featureRowLabel, { color: '#EF4444' }]}>Sign Out</Text>
                  <Ionicons name="chevron-forward" size={16} color={bg('#9CA3AF', '#6B7280')} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.featureRow, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderBottomColor: bg('#F3F4F6', '#374151') }]}
                  onPress={() => setShowAuth(true)}
                >
                  <Ionicons name="log-in-outline" size={20} color={bg('#4F46E5', '#A78BFA')} />
                  <Text style={[styles.featureRowLabel, { color: bg('#1F2937', '#F9FAFB') }]}>Sign In</Text>
                  <Ionicons name="chevron-forward" size={16} color={bg('#9CA3AF', '#6B7280')} />
                </TouchableOpacity>
              )}

              {/* Danger Zone */}
              <View style={[styles.dangerZone, { borderColor: bg('#FCA5A5', '#7F1D1D') }]}>
                <Text style={[styles.dangerZoneTitle, { color: bg('#EF4444', '#F87171') }]}>Danger Zone</Text>
                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: bg('#FEE2E2', '#7F1D1D'), borderColor: bg('#FCA5A5', '#DC2626') }]}
                  onPress={handleReset}
                >
                  <Text style={styles.resetButtonText}>🔄 Reset All Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Bottom Tab Bar ── */}
        <View style={[styles.tabBar, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderTopColor: bg('#E5E7EB', '#374151') }]}>
          {([
            { key: 'home' as const, icon: 'home-outline' as const, activeIcon: 'home' as const, label: 'Home' },
            { key: 'levels' as const, icon: 'layers-outline' as const, activeIcon: 'layers' as const, label: 'Levels' },
            { key: 'phrases' as const, icon: 'chatbubbles-outline' as const, activeIcon: 'chatbubbles' as const, label: 'Phrases' },
            { key: 'profile' as const, icon: 'person-outline' as const, activeIcon: 'person' as const, label: 'Profile' },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={24}
                  color={isActive ? '#4F46E5' : '#6B7280'}
                />
                <Text style={[styles.tabLabel, { color: isActive ? '#4F46E5' : '#6B7280' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Modals ── */}
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
  // ── Full-screen mode wrappers (shared with Flashcard/Quiz views) ──
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#1F2937',
  },
  darkHeader: {
    backgroundColor: '#111827',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  darkBackButton: {},
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingRight: 16,
  },
  darkDifficultyText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#D1D5DB',
  },
  // ── Error display ──
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
  // ── Top header ──
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  headerIconBtn: {
    padding: 6,
  },
  // ── Tab content scroll ──
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  // ── Hero card ──
  heroCard: {
    margin: 16,
    borderRadius: 18,
    padding: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
  },
  // ── Levels tab ──
  levelsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
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
  levelCardInner: {
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
    paddingVertical: 9,
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
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  levelQuizBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dividerPill: {
    alignSelf: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 8,
  },
  dividerPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ── Profile tab ──
  profileSection: {
    paddingTop: 16,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  profileAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarLargeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  statsBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
  },
  statBadgeNumber: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statBadgeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statBadgeDivider: {
    width: 1,
    height: 36,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  featureRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  dangerZone: {
    margin: 16,
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  dangerZoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  resetButton: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  // ── Start Learning CTA ──
  ctaCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Bottom tab bar ──
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default memo(App);
