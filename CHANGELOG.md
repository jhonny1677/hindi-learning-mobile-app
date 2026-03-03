# Changelog

All notable changes to Seekho Hindi are documented here.

## [Unreleased]

## 2026-06-18

Final CHANGELOG update and production readiness review.

## 2026-06-17

Updated README with full project documentation and setup instructions.

## 2026-06-16

All 142 tests passing with zero TypeScript errors confirmed.

## 2026-06-15

Fixed all test setup issues with dynamic imports and mock configuration.

## 2026-06-14

Wrote edge case test cases.

## 2026-06-13

Wrote flashcard flow test cases.

## 2026-06-12

Wrote progress reset test cases.

## 2026-06-11

Wrote level completion test cases.

## 2026-06-10

Wrote streak tracking test cases.

## 2026-06-09

Wrote milestones and badges test cases.

## 2026-06-08

Wrote points and scoring test cases.

## 2026-06-07

Wrote authentication and authorization test cases.

## 2026-06-06

Added positive Hindi audio feedback on Got It button press.

## 2026-06-05

Added Alert import that was missing from react-native in speechUtils.

## 2026-06-04

Fixed BEGINNER badge padding so it does not overlap system status bar icons.

## 2026-06-03

Fixed Back button styling in flashcard mode to remove gray pill background.

## 2026-06-02

Added Edit Profile, Analytics, Quests, Social menu rows to Profile tab.

## 2026-06-01

Added Words, Streak, and Min Studied stat badges to Profile tab.

## 2026-05-31

Added profile avatar card with user name and level display.

## 2026-05-30

Fixed truncated hint text on flashcard back face to read Tap to flip back to Hindi.

## 2026-05-29

Fixed flashcard audio button by removing e.stopPropagation inside Animated.View.

## 2026-05-28

Added Start Session CTA card on Home tab.

## 2026-05-27

Moved Privacy Policy and Terms of Service to Profile tab footer.

## 2026-05-26

Moved Reset All Progress to Profile tab Danger Zone with confirmation dialog.

## 2026-05-25

Added Foundation Learning section divider for Alphabet and Grammar.

## 2026-05-24

Redesigned level cards with consistent Play and Quiz buttons.

## 2026-05-23

Added 7-day circle row with today highlighted in orange.

## 2026-05-22

Redesigned Daily Streak section with colored Current and Best sub-cards.

## 2026-05-21

Built gradient hero card with greeting and summary stats.

## 2026-05-20

Added Home, Levels, Phrases, Profile tabs to bottom navigation.

## 2026-05-19

Replaced pill button navigation bar with bottom tab bar.

## 2026-05-18

Fixed alphabet and grammar quiz badge colors from gray to purple and pink.

## 2026-05-17

Optimized storage reads by removing AsyncStorage call from every card swipe.

## 2026-05-16

Removed all debug console.log statements from production code.

## 2026-05-15

Fixed Phrases screen being unreachable from main navigation.

## 2026-05-14

Fixed user stats resetting to zero on every app reload.

## 2026-05-13

Fixed dark mode preference not persisting to AsyncStorage.

## 2026-05-12

Fixed quiz final score off by one due to stale closure in handleNext.

## 2026-05-11

Fixed SafeAreaView deprecated import in app/index.tsx and simple.tsx.

## 2026-05-10

Converted notificationService to dynamic import to prevent Expo Go crash.

## 2026-05-09

Added isExpoGo guard to skip push notifications in Expo Go.

## 2026-05-08

Implemented daily reminder notification scheduling.

## 2026-05-07

Added notificationService with expo-notifications integration.

## 2026-05-06

Integrated TanStack Query and added QueryProvider wrapper.

## 2026-05-05

Added orientationService and hapticService abstractions.

## 2026-05-04

Implemented performanceService for render monitoring.

## 2026-05-03

Added VirtualizedWordList using Shopify FlashList for performance.

## 2026-05-02

Created ErrorBoundary component for graceful crash handling.

## 2026-05-01

Replaced window.addEventListener with NetInfo in offlineUtils.

## 2026-04-30

Added expo-haptics tactile feedback on Got It and Didnt Know.

## 2026-04-29

Set language to hi-IN with fallback to hi in speechUtils.

## 2026-04-28

Integrated expo-speech for Hindi text-to-speech pronunciation.

## 2026-04-27

Created OfflineIndicator component showing network status.

## 2026-04-26

Added RewardNotification component for badge award animations.

## 2026-04-25

Created OnboardingTutorial component for new users.

## 2026-04-24

Added form validation to login and signup flows.

## 2026-04-23

Implemented CredentialLogin component with email and password fields.

## 2026-04-22

Added UserProfile component with avatar and stats display.

## 2026-04-21

Created SocialFeatures component with leaderboard layout.

## 2026-04-20

Implemented analyticsUtils for aggregating study statistics.

## 2026-04-19

Created WordProgress component for individual word tracking.

## 2026-04-18

Created CategoryStats component for per-level progress bars.

## 2026-04-17

Added words learned per day chart data to analytics.

## 2026-04-16

Added daily study time tracking to analytics.

## 2026-04-15

Created AnalyticsDashboard component skeleton.

## 2026-04-14

Badge state persists in AsyncStorage across reloads.

## 2026-04-13

Added Streak Legend badge for 100 day streak.

## 2026-04-12

Added Week Warrior and Monthly Master streak badges.

## 2026-04-11

Added Vocabulary Builder and Century Club badges.

## 2026-04-10

Added First Steps and Getting Started badges.

## 2026-04-09

Implemented questManager utility for badge award logic.

## 2026-04-08

Created QuestsAndBadges component UI.

## 2026-04-07

Built 7-day circle row showing studied days of the week.

## 2026-04-06

Added best streak tracking that never resets.

## 2026-04-05

Added streak persistence to AsyncStorage.

## 2026-04-04

Implemented daily streak increment logic with date comparison.

## 2026-04-03

Created StreakTracker component with current and best streak display.

## 2026-04-02

Fixed quiz option generation to prevent duplicate choices.

## 2026-04-01

Added difficulty-based word filtering for quiz question generation.

## 2026-03-31

Added score tracking and QuizResults screen.

## 2026-03-30

Implemented answer selection and correct answer highlighting in quiz.

## 2026-03-29

Created Quiz component with multiple choice question layout.

## 2026-03-28

Built CompletionModal shown at end of study session.

## 2026-03-27

Created study session flow with progress counter.

## 2026-03-26

Added card queue logic so Didnt Know cards reappear later.

## 2026-03-25

Implemented Got It and Didnt Know button handlers on flashcard.

## 2026-03-24

Added flip animation to Flashcard using React Native Reanimated.

## 2026-03-23

Created Flashcard component with basic front and back faces.

## 2026-03-22

Total word database complete at 2395 entries.

## 2026-03-21

Added 91 grammar and sentence structure entries.

## 2026-03-20

Added 49 Devanagari alphabet entries to database.

## 2026-03-19

Added expert level with 345 master-level words.

## 2026-03-18

Completed advanced level with 522 total words.

## 2026-03-17

Added 180 more advanced words, total 360.

## 2026-03-16

Started advanced level, added first 180 words.

## 2026-03-15

Completed intermediate level with 537 total words.

## 2026-03-14

Added 180 more intermediate words, total 360.

## 2026-03-13

Started intermediate level, added first 180 words.

## 2026-03-12

Completed beginner level with 605 total words.

## 2026-03-11

Added 200 more beginner words, total 400 beginner words.

## 2026-03-10

Added first 200 beginner level Hindi words to database.

## 2026-03-09

Defined Hindi word data structure and TypeScript interfaces.

## 2026-03-08

Built webStorage utility abstracting AsyncStorage.

## 2026-03-07

Created AppContext with useReducer for global state.

## 2026-03-06

Added basic app layout and root navigator.

## 2026-03-05

Set up TypeScript configuration and path aliases.

## 2026-03-04

Configured expo-router for file-based navigation.

## 2026-03-03

Initial project setup with Expo and React Native.
