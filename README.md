# Seekho Hindi

A React Native flashcard app for learning Hindi vocabulary, built with Expo.

## Description

Seekho Hindi helps users learn Hindi through spaced-repetition flashcards, multiple choice quizzes, daily streak tracking, and a badge reward system. The app works offline and supports both Android and iOS via Expo Go.

## Tech Stack

- Expo 53
- React Native 0.79
- TypeScript
- AsyncStorage via @react-native-async-storage/async-storage
- expo-speech for Hindi text-to-speech pronunciation
- expo-haptics for tactile feedback
- TanStack Query for server state management
- Shopify FlashList for virtualized word lists
- React Native Reanimated for flip card animations
- expo-router for file-based navigation
- expo-notifications for daily study reminders

## Features

- 2395 Hindi words across 6 levels: Beginner 605, Intermediate 537, Advanced 522, Expert 345, Alphabet 49, Grammar 91
- Flashcard flip animation with front Hindi and back English faces
- Text-to-speech pronunciation of Hindi words using hi-IN locale with fallback to hi
- Multiple choice quiz mode with automatic scoring
- Daily streak tracking with a 7-day calendar row
- Quest and badge system with 18 unlockable badges
- XP and level progression system
- Analytics dashboard showing study history
- Social features with leaderboard
- User authentication with local email and password accounts stored on device
- Offline support with queued action sync
- Dark mode with persisted preference
- Reset All Progress option in Profile tab Danger Zone

## Project Structure

    HindiLearningApp/
      app/
        (tabs)/
          explore.tsx          Phrases and explore screen
        index.tsx              Main app with tabbed navigation
        simple.tsx             Simplified entry point
      components/
        AnalyticsDashboard.tsx
        CategoryStats.tsx
        CompletionModal.tsx
        CredentialLogin.tsx
        ErrorBoundary.tsx
        Flashcard.tsx
        OfflineIndicator.tsx
        OnboardingTutorial.tsx
        PrivacyPolicy.tsx
        QuestsAndBadges.tsx
        QuizResults.tsx
        Quiz.tsx
        RewardNotification.tsx
        SocialFeatures.tsx
        StreakTracker.tsx
        UserProfile.tsx
        VirtualizedWordList.tsx
        WordProgress.tsx
      contexts/
        AppContext.tsx          Global state with useReducer
      database/
        database.ts            SQLite database service and word interfaces
      hooks/
        useColorScheme.ts
        useErrorHandler.ts
        useOfflineMode.ts
        useQuery.ts
        useThemeColor.ts
      services/
        hapticService.ts
        notificationService.ts
        orientationService.ts
        performanceService.ts
      utils/
        analyticsUtils.ts
        notificationManager.ts
        offlineUtils.ts
        questManager.ts
        speechUtils.ts
        webStorage.ts
      __tests__/
        app.test.ts            51 unit tests for core utilities
        comprehensive.test.ts  76 tests covering all 8 feature areas

## How to Run

    npm install
    npx expo start

Scan the QR code with Expo Go on Android or iOS.

For web:

    npx expo start --web

## How to Run Tests

    npx jest --verbose

Run a specific test file:

    npx jest --testPathPattern=comprehensive --verbose

## Environment Requirements

- Node 18 or higher
- Expo Go app installed on Android or iOS device
- npm 9 or higher

## Test Coverage

The test suite covers:
- Authentication and authorization flows
- Points and scoring logic
- Milestone and badge award conditions
- Streak tracking and reset logic
- Level completion detection
- Progress reset behavior
- Flashcard session flow
- Edge cases including offline, corrupted storage, and empty word lists
