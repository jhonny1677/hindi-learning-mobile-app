import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService, Word, UserProgress, LearningAnalytics } from '../database/database';
import { useAppContext } from '../contexts/AppContext';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Query Keys
export const queryKeys = {
  words: ['words'] as const,
  wordsByDifficulty: (difficulty: Difficulty) => ['words', difficulty] as const,
  userProgress: ['userProgress'] as const,
  userProgressByWord: (wordId: number) => ['userProgress', wordId] as const,
  difficultyProgress: (difficulty: Difficulty) => ['difficultyProgress', difficulty] as const,
  allProgress: ['allProgress'] as const,
  analytics: ['analytics'] as const,
  wordsDueForReview: (difficulty?: Difficulty) => ['wordsDueForReview', difficulty] as const,
};

// Word Queries
export const useWordsQuery = () => {
  return useQuery({
    queryKey: queryKeys.words,
    queryFn: async () => {
      await databaseService.init();
      return await databaseService.getAllWords();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useWordsByDifficultyQuery = (difficulty: Difficulty) => {
  return useQuery({
    queryKey: queryKeys.wordsByDifficulty(difficulty),
    queryFn: async () => {
      await databaseService.init();
      return databaseService.getWordsByDifficulty(difficulty);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!difficulty,
  });
};

export const useRandomWordQuery = (difficulty: Difficulty, useAdaptive: boolean = false) => {
  return useQuery({
    queryKey: ['randomWord', difficulty, useAdaptive],
    queryFn: async () => {
      await databaseService.init();
      
      if (useAdaptive) {
        const adaptiveWord = await databaseService.getAdaptiveDifficultyWord(difficulty);
        if (adaptiveWord) return adaptiveWord;
        
        const dueWords = await databaseService.getWordsDueForReview(difficulty);
        if (dueWords.length > 0) {
          return dueWords[Math.floor(Math.random() * dueWords.length)];
        }
      }
      
      return databaseService.getRandomWord(difficulty);
    },
    enabled: !!difficulty && difficulty !== 'beginner' || true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 seconds
    gcTime: 30000, // 30 seconds
  });
};

// Progress Queries
export const useUserProgressQuery = (wordId: number) => {
  return useQuery({
    queryKey: queryKeys.userProgressByWord(wordId),
    queryFn: () => databaseService.getUserProgress(wordId),
    enabled: !!wordId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useDifficultyProgressQuery = (difficulty: Difficulty) => {
  return useQuery({
    queryKey: queryKeys.difficultyProgress(difficulty),
    queryFn: () => databaseService.getDifficultyProgress(difficulty),
    enabled: !!difficulty,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useAllProgressQuery = () => {
  return useQuery({
    queryKey: queryKeys.allProgress,
    queryFn: () => databaseService.getAllProgress(),
    staleTime: 60 * 1000,
  });
};

export const useAnalyticsQuery = () => {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: async () => {
      return databaseService.getLearningAnalytics();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export const useWordsDueForReviewQuery = (difficulty?: Difficulty) => {
  return useQuery({
    queryKey: queryKeys.wordsDueForReview(difficulty),
    queryFn: () => databaseService.getWordsDueForReview(difficulty),
    staleTime: 30 * 1000,
  });
};

// Mutations
export const useUpdateProgressMutation = () => {
  const queryClient = useQueryClient();
  const { updateScore } = useAppContext();
  
  return useMutation({
    mutationFn: async ({ 
      wordId, 
      correct, 
      responseTime 
    }: { 
      wordId: number; 
      correct: boolean; 
      responseTime?: number; 
    }) => {
      await databaseService.updateProgressWithSRS(wordId, correct, responseTime);
      updateScore(correct);
      return { wordId, correct, responseTime };
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userProgressByWord(data.wordId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allProgress });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      
      // Update difficulty progress for the word's difficulty
      queryClient.invalidateQueries({ queryKey: ['difficultyProgress'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.wordsDueForReview() });
    },
  });
};

export const useMarkDifficultyCompletedMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (difficulty: Difficulty) => databaseService.markDifficultyCompleted(difficulty),
    onSuccess: (_, difficulty) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.difficultyProgress(difficulty) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allProgress });
    },
  });
};

// Background sync mutation
export const useSyncMutation = () => {
  const queryClient = useQueryClient();
  const { setLastSyncTime, setIsOffline } = useAppContext();
  
  return useMutation({
    mutationFn: async () => {
      try {
        // Simulate server sync - in real app this would sync with backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh all queries
        await queryClient.invalidateQueries();
        
        setLastSyncTime(Date.now());
        setIsOffline(false);
        
        return { success: true, timestamp: Date.now() };
      } catch (error) {
        setIsOffline(true);
        throw error;
      }
    },
  });
};

// Prefetch utilities
export const usePrefetchUtils = () => {
  const queryClient = useQueryClient();
  
  const prefetchDifficultyWords = async (difficulty: Difficulty) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.wordsByDifficulty(difficulty),
      queryFn: async () => {
        await databaseService.init();
        return databaseService.getWordsByDifficulty(difficulty);
      },
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchAnalytics = async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.analytics,
      queryFn: () => databaseService.getLearningAnalytics(),
      staleTime: 2 * 60 * 1000,
    });
  };
  
  const prefetchNextWords = async (difficulty: Difficulty, count: number = 3) => {
    const dueWords = await databaseService.getWordsDueForReview(difficulty);
    const wordsToCache = dueWords.slice(0, count);
    
    wordsToCache.forEach((word) => {
      queryClient.setQueryData(['cachedWord', word.id], word);
    });
  };
  
  return {
    prefetchDifficultyWords,
    prefetchAnalytics,
    prefetchNextWords,
  };
};