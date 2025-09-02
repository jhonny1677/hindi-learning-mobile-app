import { create } from 'zustand';
import { Word, UserProgress, LearningAnalytics } from '../database/database';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface ProgressData {
  beginner: { total: number; completed: number; percentage: number; isComplete: boolean };
  intermediate: { total: number; completed: number; percentage: number; isComplete: boolean };
  advanced: { total: number; completed: number; percentage: number; isComplete: boolean };
  expert: { total: number; completed: number; percentage: number; isComplete: boolean };
}

interface AppState {
  // Learning State
  currentWord: Word | null;
  difficulty: Difficulty | null;
  loading: boolean;
  score: { correct: number; total: number };
  
  // UI State
  showWordProgress: Difficulty | null;
  showAnalytics: boolean;
  useAdaptiveLearning: boolean;
  completionModal: { visible: boolean; difficulty: Difficulty | null };
  
  // Data State
  progressData: ProgressData | null;
  analytics: LearningAnalytics | null;
  lastSyncTime: number;
  isOffline: boolean;
  
  // Settings
  studyReminders: boolean;
  hapticFeedback: boolean;
  darkMode: boolean;
  
  // Performance
  componentCache: Map<string, any>;
  
  // Actions
  setCurrentWord: (word: Word | null) => void;
  setDifficulty: (difficulty: Difficulty | null) => void;
  setLoading: (loading: boolean) => void;
  updateScore: (correct: boolean) => void;
  resetScore: () => void;
  
  setShowWordProgress: (difficulty: Difficulty | null) => void;
  setShowAnalytics: (show: boolean) => void;
  setUseAdaptiveLearning: (use: boolean) => void;
  setCompletionModal: (modal: { visible: boolean; difficulty: Difficulty | null }) => void;
  
  setProgressData: (data: ProgressData) => void;
  setAnalytics: (analytics: LearningAnalytics) => void;
  setLastSyncTime: (time: number) => void;
  setIsOffline: (offline: boolean) => void;
  
  toggleStudyReminders: () => void;
  toggleHapticFeedback: () => void;
  toggleDarkMode: () => void;
  
  cacheComponent: (key: string, data: any) => void;
  getCachedComponent: (key: string) => any;
  clearCache: () => void;
  
  // Reset all state
  resetApp: () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
      // Initial State
      currentWord: null,
      difficulty: null,
      loading: false,
      score: { correct: 0, total: 0 },
      
      showWordProgress: null,
      showAnalytics: false,
      useAdaptiveLearning: false,
      completionModal: { visible: false, difficulty: null },
      
      progressData: null,
      analytics: null,
      lastSyncTime: 0,
      isOffline: false,
      
      studyReminders: true,
      hapticFeedback: true,
      darkMode: false,
      
      componentCache: new Map(),
      
      // Actions
      setCurrentWord: (word) => set({ currentWord: word }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setLoading: (loading) => set({ loading }),
      updateScore: (correct) => set((state) => ({
        score: {
          correct: state.score.correct + (correct ? 1 : 0),
          total: state.score.total + 1
        }
      })),
      resetScore: () => set({ score: { correct: 0, total: 0 } }),
      
      setShowWordProgress: (difficulty) => set({ showWordProgress: difficulty }),
      setShowAnalytics: (show) => set({ showAnalytics: show }),
      setUseAdaptiveLearning: (use) => set({ useAdaptiveLearning: use }),
      setCompletionModal: (modal) => set({ completionModal: modal }),
      
      setProgressData: (data) => set({ progressData: data }),
      setAnalytics: (analytics) => set({ analytics }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setIsOffline: (offline) => set({ isOffline: offline }),
      
      toggleStudyReminders: () => set((state) => ({ studyReminders: !state.studyReminders })),
      toggleHapticFeedback: () => set((state) => ({ hapticFeedback: !state.hapticFeedback })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      cacheComponent: (key, data) => set((state) => {
        const newCache = new Map(state.componentCache);
        newCache.set(key, data);
        return { componentCache: newCache };
      }),
      getCachedComponent: (key) => get().componentCache.get(key),
      clearCache: () => set({ componentCache: new Map() }),
      
      resetApp: () => set({
        currentWord: null,
        difficulty: null,
        loading: false,
        score: { correct: 0, total: 0 },
        showWordProgress: null,
        showAnalytics: false,
        completionModal: { visible: false, difficulty: null },
        progressData: null,
        analytics: null,
        componentCache: new Map(),
      }),
    }));

// Selectors for optimized re-renders with shallow comparison
export const useCurrentWord = () => useAppStore((state) => state.currentWord);
export const useDifficulty = () => useAppStore((state) => state.difficulty);
export const useLoading = () => useAppStore((state) => state.loading);
export const useScore = () => useAppStore((state) => state.score);

// Memoized selectors to prevent unnecessary re-renders
const uiStateSelector = (state: AppState) => ({
  showWordProgress: state.showWordProgress,
  showAnalytics: state.showAnalytics,
  useAdaptiveLearning: state.useAdaptiveLearning,
  completionModal: state.completionModal,
});

const settingsSelector = (state: AppState) => ({
  studyReminders: state.studyReminders,
  hapticFeedback: state.hapticFeedback,
  darkMode: state.darkMode,
});

export const useUIState = () => useAppStore(uiStateSelector);
export const useSettings = () => useAppStore(settingsSelector);