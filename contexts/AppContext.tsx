import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Word, LearningAnalytics } from '../database/database';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'alphabet' | 'grammar';

interface ProgressData {
  beginner: { total: number; completed: number; percentage: number; isComplete: boolean };
  intermediate: { total: number; completed: number; percentage: number; isComplete: boolean };
  advanced: { total: number; completed: number; percentage: number; isComplete: boolean };
  expert: { total: number; completed: number; percentage: number; isComplete: boolean };
  alphabet: { total: number; completed: number; percentage: number; isComplete: boolean };
  grammar: { total: number; completed: number; percentage: number; isComplete: boolean };
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

  // Quiz State
  isQuizMode: boolean;
  quizWords: Word[];
  currentQuizIndex: number;
  quizScore: { correct: number; total: number };
  quizOptions: string[];

  // Data State
  progressData: ProgressData | null;
  analytics: LearningAnalytics | null;

  // Network State
  isOffline: boolean;
  lastSyncTime: number | null;

  // UI Theme
  darkMode: boolean;
}

type AppAction =
  | { type: 'SET_CURRENT_WORD'; payload: Word | null }
  | { type: 'SET_DIFFICULTY'; payload: Difficulty | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_SCORE' }
  | { type: 'UPDATE_SCORE'; payload: boolean }
  | { type: 'SET_SHOW_WORD_PROGRESS'; payload: Difficulty | null }
  | { type: 'SET_SHOW_ANALYTICS'; payload: boolean }
  | { type: 'SET_USE_ADAPTIVE_LEARNING'; payload: boolean }
  | { type: 'SET_COMPLETION_MODAL'; payload: { visible: boolean; difficulty: Difficulty | null } }
  | { type: 'SET_IS_QUIZ_MODE'; payload: boolean }
  | { type: 'SET_QUIZ_WORDS'; payload: Word[] }
  | { type: 'SET_CURRENT_QUIZ_INDEX'; payload: number }
  | { type: 'RESET_QUIZ_SCORE' }
  | { type: 'UPDATE_QUIZ_SCORE'; payload: boolean }
  | { type: 'SET_QUIZ_OPTIONS'; payload: string[] }
  | { type: 'SET_PROGRESS_DATA'; payload: ProgressData | null }
  | { type: 'SET_ANALYTICS'; payload: LearningAnalytics | null }
  | { type: 'SET_IS_OFFLINE'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: number | null }
  | { type: 'SET_DARK_MODE'; payload: boolean };

const initialState: AppState = {
  currentWord: null,
  difficulty: null,
  loading: false,
  score: { correct: 0, total: 0 },
  showWordProgress: null,
  showAnalytics: false,
  useAdaptiveLearning: false,
  completionModal: { visible: false, difficulty: null },
  isQuizMode: false,
  quizWords: [],
  currentQuizIndex: 0,
  quizScore: { correct: 0, total: 0 },
  quizOptions: [],
  progressData: null,
  analytics: null,
  isOffline: false,
  lastSyncTime: null,
  darkMode: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_WORD':
      return { ...state, currentWord: action.payload };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'RESET_SCORE':
      return { ...state, score: { correct: 0, total: 0 } };
    case 'UPDATE_SCORE':
      return {
        ...state,
        score: {
          correct: action.payload ? state.score.correct + 1 : state.score.correct,
          total: state.score.total + 1
        }
      };
    case 'SET_SHOW_WORD_PROGRESS':
      return { ...state, showWordProgress: action.payload };
    case 'SET_SHOW_ANALYTICS':
      return { ...state, showAnalytics: action.payload };
    case 'SET_USE_ADAPTIVE_LEARNING':
      return { ...state, useAdaptiveLearning: action.payload };
    case 'SET_COMPLETION_MODAL':
      return { ...state, completionModal: action.payload };
    case 'SET_IS_QUIZ_MODE':
      return { ...state, isQuizMode: action.payload };
    case 'SET_QUIZ_WORDS':
      return { ...state, quizWords: action.payload };
    case 'SET_CURRENT_QUIZ_INDEX':
      return { ...state, currentQuizIndex: action.payload };
    case 'RESET_QUIZ_SCORE':
      return { ...state, quizScore: { correct: 0, total: 0 } };
    case 'UPDATE_QUIZ_SCORE':
      return {
        ...state,
        quizScore: {
          correct: action.payload ? state.quizScore.correct + 1 : state.quizScore.correct,
          total: state.quizScore.total + 1
        }
      };
    case 'SET_QUIZ_OPTIONS':
      return { ...state, quizOptions: action.payload };
    case 'SET_PROGRESS_DATA':
      return { ...state, progressData: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_IS_OFFLINE':
      return { ...state, isOffline: action.payload };
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  setCurrentWord: (word: Word | null) => void;
  setDifficulty: (difficulty: Difficulty | null) => void;
  setLoading: (loading: boolean) => void;
  resetScore: () => void;
  updateScore: (correct: boolean) => void;
  setShowWordProgress: (difficulty: Difficulty | null) => void;
  setShowAnalytics: (show: boolean) => void;
  setUseAdaptiveLearning: (use: boolean) => void;
  setCompletionModal: (modal: { visible: boolean; difficulty: Difficulty | null }) => void;
  setIsQuizMode: (isQuiz: boolean) => void;
  setQuizWords: (words: Word[]) => void;
  setCurrentQuizIndex: (index: number) => void;
  resetQuizScore: () => void;
  updateQuizScore: (correct: boolean) => void;
  setQuizOptions: (options: string[]) => void;
  setProgressData: (data: ProgressData | null) => void;
  setAnalytics: (data: LearningAnalytics | null) => void;
  setIsOffline: (offline: boolean) => void;
  setLastSyncTime: (time: number | null) => void;
  setDarkMode: (darkMode: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue: AppContextType = {
    state,
    setCurrentWord: (word) => dispatch({ type: 'SET_CURRENT_WORD', payload: word }),
    setDifficulty: (difficulty) => dispatch({ type: 'SET_DIFFICULTY', payload: difficulty }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    resetScore: () => dispatch({ type: 'RESET_SCORE' }),
    updateScore: (correct) => dispatch({ type: 'UPDATE_SCORE', payload: correct }),
    setShowWordProgress: (difficulty) => dispatch({ type: 'SET_SHOW_WORD_PROGRESS', payload: difficulty }),
    setShowAnalytics: (show) => dispatch({ type: 'SET_SHOW_ANALYTICS', payload: show }),
    setUseAdaptiveLearning: (use) => dispatch({ type: 'SET_USE_ADAPTIVE_LEARNING', payload: use }),
    setCompletionModal: (modal) => dispatch({ type: 'SET_COMPLETION_MODAL', payload: modal }),
    setIsQuizMode: (isQuiz) => dispatch({ type: 'SET_IS_QUIZ_MODE', payload: isQuiz }),
    setQuizWords: (words) => dispatch({ type: 'SET_QUIZ_WORDS', payload: words }),
    setCurrentQuizIndex: (index) => dispatch({ type: 'SET_CURRENT_QUIZ_INDEX', payload: index }),
    resetQuizScore: () => dispatch({ type: 'RESET_QUIZ_SCORE' }),
    updateQuizScore: (correct) => dispatch({ type: 'UPDATE_QUIZ_SCORE', payload: correct }),
    setQuizOptions: (options) => dispatch({ type: 'SET_QUIZ_OPTIONS', payload: options }),
    setProgressData: (data) => dispatch({ type: 'SET_PROGRESS_DATA', payload: data }),
    setAnalytics: (data) => dispatch({ type: 'SET_ANALYTICS', payload: data }),
    setIsOffline: (offline) => dispatch({ type: 'SET_IS_OFFLINE', payload: offline }),
    setLastSyncTime: (time) => dispatch({ type: 'SET_LAST_SYNC_TIME', payload: time }),
    setDarkMode: (darkMode) => dispatch({ type: 'SET_DARK_MODE', payload: darkMode }),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks for specific parts of state
export function useCurrentWord() {
  const { state } = useAppContext();
  return state.currentWord;
}

export function useDifficulty() {
  const { state } = useAppContext();
  return state.difficulty;
}

export function useLoading() {
  const { state } = useAppContext();
  return state.loading;
}

export function useScore() {
  const { state } = useAppContext();
  return state.score;
}

export function useSettings() {
  const { state } = useAppContext();
  return {
    useAdaptiveLearning: state.useAdaptiveLearning,
    hapticFeedback: true, // Default setting
    darkMode: state.darkMode,
  };
}

export function useUIState() {
  const { state } = useAppContext();
  return [
    state.showWordProgress,
    state.showAnalytics,
    state.useAdaptiveLearning,
    state.completionModal
  ] as const;
}