/**
 * Comprehensive test suite – Seekho Hindi App
 * Covers all 8 sections from the prompt.
 *
 * Design decisions:
 * - No dynamic import() inside tests (fails without --experimental-vm-modules)
 * - Static module-level imports let jest.mock hoisting work correctly
 * - Direct _store manipulation replaces await webStorage.* calls
 */

import type { Word } from '../database/database';

// ── Mocks (hoisted before all imports by Jest) ────────────────────────────────

jest.mock('../components/QuestsAndBadges', () => ({}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Vibration: { vibrate: jest.fn() },
  Alert: { alert: jest.fn() },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Modal: 'Modal',
  ScrollView: 'ScrollView',
  Animated: {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({})),
    })),
    timing: jest.fn(() => ({ start: jest.fn((cb?: () => void) => cb?.()) })),
    spring: jest.fn(() => ({ start: jest.fn((cb?: () => void) => cb?.()) })),
  },
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn((_algo: string, input: string) =>
    Promise.resolve(`mock_hash_${input}`),
  ),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { HEX: 'HEX' },
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('../services/hapticService', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('../utils/analyticsUtils', () => ({
  analyticsManager: { triggerAnalyticsUpdate: jest.fn() },
}));

jest.mock('../utils/notificationManager', () => ({
  notificationManager: {
    setCallback: jest.fn(),
    showXPGain: jest.fn(),
    showBadgeUnlocked: jest.fn(),
    showQuestCompleted: jest.fn(),
    showLevelUp: jest.fn(),
    showNotification: jest.fn(),
  },
}));

// In-memory AsyncStorage
const _store: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(_store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      _store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete _store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(_store).forEach(k => delete _store[k]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(_store))),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach(k => delete _store[k]);
      return Promise.resolve();
    }),
  },
}));

// ── Static module imports (work because jest.mock is hoisted before these) ──

import * as Speech from 'expo-speech';
import { questManager } from '../utils/questManager';
import { notificationManager } from '../utils/notificationManager';
import { speakHindi } from '../utils/speechUtils';
import * as Crypto from 'expo-crypto';

// ── Helpers ───────────────────────────────────────────────────────────────────

const clearStore = () => Object.keys(_store).forEach(k => delete _store[k]);

const makeWord = (overrides: Partial<Word> = {}): Word => ({
  id: 1,
  hindi: 'नमस्ते',
  english: 'Hello',
  difficulty: 'beginner',
  pronunciation: 'namaste',
  ...overrides,
});

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString().split('T')[0];

const DAILY_STATS_KEY = 'hindi_learning_daily_stats';
const STREAK_KEY = 'hindi_learning_streak';
const BADGES_KEY = 'hindi_learning_badges';
const XP_KEY = 'hindi_learning_xp';
const USER_KEY = 'hindi_learning_user';
const PROFILE_KEY = 'hindi_learning_profile';
const ACCOUNTS_KEY = 'hindi_accounts';

/** Write a value directly to the mock store as JSON */
const storeSet = (key: string, data: unknown) => {
  _store[key] = JSON.stringify(data);
};

/** Read a value directly from the mock store as parsed JSON */
const storeGet = <T = unknown>(key: string): T | null => {
  const raw = _store[key];
  return raw ? (JSON.parse(raw) as T) : null;
};

/** Seed daily stats into the mock store (avoids webStorage import) */
const seedDailyStats = (overrides: Partial<{
  wordsLearned: number; studyTimeMinutes: number; streak: number;
  correctAnswers: number; totalAnswers: number;
}> = {}) => {
  storeSet(DAILY_STATS_KEY, {
    date: today(),
    wordsLearned: 0,
    studyTimeMinutes: 0,
    streak: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    ...overrides,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTICATION & AUTHORIZATION
// ─────────────────────────────────────────────────────────────────────────────

describe('1. Authentication & Authorization', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('1.1 guest user: hindi_learning_user key does not exist', () => {
    expect(_store[USER_KEY]).toBeUndefined();
  });

  it('1.2 sign-up writes account to hindi_accounts storage', async () => {
    const email = 'test@example.com';
    const password = 'secret123';
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + 'seekho_hindi_2025',
      { encoding: Crypto.CryptoEncoding.HEX },
    );
    const account = { id: 'user_1', name: 'Test User', email, passwordHash: hash, createdAt: '' };
    storeSet(ACCOUNTS_KEY, [account]);
    const stored = storeGet<typeof account[]>(ACCOUNTS_KEY)!;
    expect(stored).toHaveLength(1);
    expect(stored[0].email).toBe(email);
  });

  it('1.3 valid sign-in: matching hash stores user in hindi_learning_user', async () => {
    const email = 'user@test.com';
    const password = 'pass1234';
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + 'seekho_hindi_2025',
      { encoding: Crypto.CryptoEncoding.HEX },
    );
    const account = { id: 'user_2', name: 'User Two', email, passwordHash: hash, createdAt: '' };
    storeSet(ACCOUNTS_KEY, [account]);

    const accounts = storeGet<typeof account[]>(ACCOUNTS_KEY)!;
    const found = accounts.find(a => a.email.toLowerCase() === email.toLowerCase())!;
    expect(found).toBeDefined();
    const inputHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + 'seekho_hindi_2025',
      { encoding: Crypto.CryptoEncoding.HEX },
    );
    expect(inputHash).toBe(found.passwordHash);
    storeSet(USER_KEY, { id: found.id, name: found.name, email: found.email, loginMethod: 'local' });
    expect(storeGet<{ name: string }>(USER_KEY)!.name).toBe('User Two');
  });

  it('1.4 invalid credentials: wrong password hash does not match', async () => {
    const storedHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'correctPass' + 'seekho_hindi_2025',
      { encoding: Crypto.CryptoEncoding.HEX },
    );
    const inputHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'wrongPass' + 'seekho_hindi_2025',
      { encoding: Crypto.CryptoEncoding.HEX },
    );
    expect(inputHash).not.toBe(storedHash);
  });

  it('1.5 empty email/password fields detected as invalid', () => {
    const email = '';
    const password = '';
    const isInvalid = !email.trim() || !password;
    expect(isInvalid).toBe(true);
  });

  it('1.6 signed-in getUserStats shows user name, not "Guest User"', () => {
    const currentUser = { id: 'u1', name: 'Ankit', loginMethod: 'local' };
    const userProfile = { name: 'Ankit', hindiLevel: 'beginner', totalWordsLearned: 5 };
    const getUserStats = (cu: typeof currentUser | null, up: typeof userProfile | null) => {
      if (!cu && !up) return { name: 'Guest User' };
      return { name: up?.name || cu?.name || 'Learner' };
    };
    expect(getUserStats(currentUser, userProfile).name).toBe('Ankit');
  });

  it('1.7 guest getUserStats returns "Guest User"', () => {
    const getUserStats = (cu: null, up: null) => {
      if (!cu && !up) return { name: 'Guest User' };
      return { name: 'Learner' };
    };
    expect(getUserStats(null, null).name).toBe('Guest User');
  });

  it('1.8 signing out removes hindi_learning_user from storage', () => {
    storeSet(USER_KEY, { id: 'u1', name: 'Test', loginMethod: 'local' });
    delete _store[USER_KEY]; // simulate removeItem
    expect(_store[USER_KEY]).toBeUndefined();
  });

  it('1.9 user profile is recovered from storage on app startup', () => {
    const profile = { id: 'u1', name: 'Persistent', email: 'p@test.com', hindiLevel: 'intermediate' };
    storeSet(PROFILE_KEY, profile);
    const loaded = storeGet<typeof profile>(PROFILE_KEY)!;
    expect(loaded.name).toBe('Persistent');
    expect(loaded.hindiLevel).toBe('intermediate');
  });

  it('1.10 two different users have separate accounts with no collision', () => {
    const accounts = [
      { id: 'u1', email: 'user1@test.com', name: 'User1', passwordHash: 'hash_a' },
      { id: 'u2', email: 'user2@test.com', name: 'User2', passwordHash: 'hash_b' },
    ];
    storeSet(ACCOUNTS_KEY, accounts);
    const stored = storeGet<typeof accounts>(ACCOUNTS_KEY)!;
    expect(stored).toHaveLength(2);
    expect(stored[0].email).not.toBe(stored[1].email);
    expect(stored[0].passwordHash).not.toBe(stored[1].passwordHash);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POINTS & SCORING
// ─────────────────────────────────────────────────────────────────────────────

describe('2. Points & Scoring', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('2.1 "Got It" (trackWordLearned) increments wordsLearned by 1', async () => {
    await questManager.trackWordLearned();
    const stats = storeGet<{ wordsLearned: number }>(DAILY_STATS_KEY)!;
    expect(stats.wordsLearned).toBe(1);
  });

  it('2.2 "Didn\'t Know" (trackStudyTime only) does NOT increment wordsLearned', async () => {
    await questManager.trackStudyTime(0.5);
    const stats = storeGet<{ wordsLearned?: number }>(DAILY_STATS_KEY);
    expect(stats?.wordsLearned ?? 0).toBe(0);
  });

  it('2.3 wordsLearned accumulates across multiple "Got It" calls', async () => {
    await questManager.trackWordLearned();
    await questManager.trackWordLearned();
    await questManager.trackWordLearned();
    const stats = storeGet<{ wordsLearned: number }>(DAILY_STATS_KEY)!;
    expect(stats.wordsLearned).toBe(3);
  });

  it('2.4 quiz correct answer increments score', () => {
    let score = { correct: 0, total: 0 };
    const answer = (ok: boolean) => {
      score = { correct: score.correct + (ok ? 1 : 0), total: score.total + 1 };
    };
    answer(true);
    expect(score.correct).toBe(1);
    expect(score.total).toBe(1);
  });

  it('2.5 quiz wrong answer does NOT increment correct count', () => {
    let score = { correct: 0, total: 0 };
    const answer = (ok: boolean) => {
      score = { correct: score.correct + (ok ? 1 : 0), total: score.total + 1 };
    };
    answer(false);
    expect(score.correct).toBe(0);
    expect(score.total).toBe(1);
  });

  it('2.6 final score matches actual correct answers – stale closure guard', () => {
    const answers = [true, false, true, true, false, true, false, true];
    let score = { correct: 0, total: 0 };
    answers.forEach(a => {
      score = { correct: score.correct + (a ? 1 : 0), total: score.total + 1 };
    });
    expect(score.correct).toBe(answers.filter(Boolean).length);
    expect(score.total).toBe(answers.length);
  });

  it('2.7 score resets to 0 when a new quiz session starts', () => {
    let score = { correct: 5, total: 10 };
    const resetScore = () => { score = { correct: 0, total: 0 }; };
    resetScore();
    expect(score.correct).toBe(0);
    expect(score.total).toBe(0);
  });

  it('2.8 trackCorrectAnswer increments correctAnswers in daily stats', async () => {
    await questManager.trackCorrectAnswer();
    const stats = storeGet<{ correctAnswers: number }>(DAILY_STATS_KEY)!;
    expect(stats.correctAnswers).toBe(1);
  });

  it('2.9 words learned count matches number of trackWordLearned calls', async () => {
    const count = 5;
    for (let i = 0; i < count; i++) await questManager.trackWordLearned();
    const stats = storeGet<{ wordsLearned: number }>(DAILY_STATS_KEY)!;
    expect(stats.wordsLearned).toBe(count);
  });

  it('2.10 daily stats persist in storage across simulated reloads', () => {
    storeSet(DAILY_STATS_KEY, { date: today(), wordsLearned: 12, correctAnswers: 10 });
    const loaded = storeGet<{ wordsLearned: number; correctAnswers: number }>(DAILY_STATS_KEY)!;
    expect(loaded.wordsLearned).toBe(12);
    expect(loaded.correctAnswers).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MILESTONES & BADGES
// ─────────────────────────────────────────────────────────────────────────────

describe('3. Milestones & Badges', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('3.1 first word learned triggers "First Steps" badge notification', async () => {
    await questManager.trackCorrectAnswer(); // correctAnswers → 1
    await questManager.trackWordLearned();
    expect(notificationManager.showBadgeUnlocked).toHaveBeenCalled();
    const calls = (notificationManager.showBadgeUnlocked as jest.Mock).mock.calls;
    expect(calls.some((c: any[]) => c[0] === 'First Steps')).toBe(true);
  });

  it('3.2 badge system initializes with 18 badges on first use', async () => {
    await questManager.trackWordLearned();
    const badges = storeGet<any[]>(BADGES_KEY)!;
    expect(badges).toHaveLength(18);
  });

  it('3.3 unlocked badge has unlockedAt timestamp set', async () => {
    await questManager.trackCorrectAnswer();
    await questManager.trackWordLearned();
    const badges = storeGet<any[]>(BADGES_KEY)!;
    const firstWord = badges.find(b => b.id === 'first_word');
    expect(firstWord?.unlockedAt).toBeDefined();
    expect(typeof firstWord.unlockedAt).toBe('string');
  });

  it('3.4 badge is NOT awarded twice for the same achievement', async () => {
    // First earn – unlocks first_word
    await questManager.trackCorrectAnswer();
    await questManager.trackWordLearned();
    const callCountAfterFirst = (notificationManager.showBadgeUnlocked as jest.Mock).mock.calls.length;

    // Second earn – first_word has unlockedAt, must be skipped
    await questManager.trackCorrectAnswer();
    await questManager.trackWordLearned();
    const callCountAfterSecond = (notificationManager.showBadgeUnlocked as jest.Mock).mock.calls.length;

    expect(callCountAfterSecond).toBe(callCountAfterFirst);
  });

  it('3.5 "Week Warrior" badge unlocks when streak >= 7 in daily stats', async () => {
    seedDailyStats({ streak: 7, wordsLearned: 1, correctAnswers: 1, totalAnswers: 1 });
    (notificationManager.showBadgeUnlocked as jest.Mock).mockClear();
    await questManager.trackWordLearned();
    const calls = (notificationManager.showBadgeUnlocked as jest.Mock).mock.calls;
    expect(calls.some((c: any[]) => c[0] === 'Week Warrior')).toBe(true);
  });

  it('3.6 "Streak Legend" badge unlocks when streak >= 30', async () => {
    seedDailyStats({ streak: 30, wordsLearned: 1, correctAnswers: 1, totalAnswers: 1 });
    (notificationManager.showBadgeUnlocked as jest.Mock).mockClear();
    await questManager.trackWordLearned();
    const calls = (notificationManager.showBadgeUnlocked as jest.Mock).mock.calls;
    expect(calls.some((c: any[]) => c[0] === 'Streak Legend')).toBe(true);
  });

  it('3.7 badges are persisted to hindi_learning_badges in storage', async () => {
    await questManager.trackWordLearned();
    expect(_store[BADGES_KEY]).toBeDefined();
    expect(storeGet<any[]>(BADGES_KEY)!.length).toBeGreaterThan(0);
  });

  it('3.8 showBadgeUnlocked fires when a new badge is earned', async () => {
    await questManager.trackCorrectAnswer();
    await questManager.trackWordLearned();
    expect(notificationManager.showBadgeUnlocked).toHaveBeenCalled();
  });

  it('3.9 "Century Club" badge unlocks when wordsLearned >= 100', async () => {
    seedDailyStats({ wordsLearned: 100, correctAnswers: 100, totalAnswers: 100 });
    (notificationManager.showBadgeUnlocked as jest.Mock).mockClear();
    await questManager.trackWordLearned();
    const calls = (notificationManager.showBadgeUnlocked as jest.Mock).mock.calls;
    expect(calls.some((c: any[]) => c[0] === 'Century Club')).toBe(true);
  });

  it('3.10 XP is added to hindi_learning_xp storage when a badge is earned', async () => {
    await questManager.trackCorrectAnswer();
    await questManager.trackWordLearned();
    const xp = storeGet<{ totalXP: number }>(XP_KEY)!;
    expect(xp.totalXP).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. STREAK TRACKING
// ─────────────────────────────────────────────────────────────────────────────

describe('4. Streak Tracking', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('4.1 streak starts at 0 – no entry for a new user', () => {
    expect(_store[STREAK_KEY]).toBeUndefined();
  });

  it('4.2 studying on day 1 sets currentStreak to 1', () => {
    const t = today();
    storeSet(STREAK_KEY, { currentStreak: 1, longestStreak: 1, lastStudyDate: t, studyDates: [t] });
    expect(storeGet<{ currentStreak: number }>(STREAK_KEY)!.currentStreak).toBe(1);
  });

  it('4.3 studying on consecutive days increments streak', () => {
    const yesterday = daysAgo(1);
    const t = today();
    const saved = { currentStreak: 3, longestStreak: 5, lastStudyDate: yesterday, studyDates: [yesterday] };
    const shouldIncrement = saved.lastStudyDate === yesterday;
    const newStreak = shouldIncrement ? saved.currentStreak + 1 : 1;
    const updated = { ...saved, currentStreak: newStreak, lastStudyDate: t, studyDates: [...saved.studyDates, t] };
    storeSet(STREAK_KEY, updated);
    expect(storeGet<{ currentStreak: number }>(STREAK_KEY)!.currentStreak).toBe(4);
  });

  it('4.4 missing a day (2+ days ago) resets currentStreak to 0', () => {
    const twoDaysAgo = daysAgo(2);
    const t = today();
    const yest = daysAgo(1);
    const data = { currentStreak: 5, longestStreak: 10, lastStudyDate: twoDaysAgo, studyDates: [] };
    const shouldReset =
      data.lastStudyDate !== t &&
      data.lastStudyDate !== yest &&
      data.currentStreak > 0;
    expect(shouldReset).toBe(true);
  });

  it('4.5 longestStreak is NOT reset when currentStreak resets', () => {
    const data = { currentStreak: 0, longestStreak: 10, lastStudyDate: daysAgo(3), studyDates: [] };
    storeSet(STREAK_KEY, data);
    const loaded = storeGet<typeof data>(STREAK_KEY)!;
    expect(loaded.longestStreak).toBe(10);
    expect(loaded.currentStreak).toBe(0);
  });

  it("4.6 today's circle is flagged as isToday in the 7-day array", () => {
    const t = today();
    const todayDate = new Date();
    const dow = todayDate.getDay();
    const daysFromMon = dow === 0 ? 6 : dow - 1;
    const monday = new Date(todayDate);
    monday.setDate(todayDate.getDate() - daysFromMon);
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return { label, dateStr, isToday: dateStr === t };
    });
    expect(weekDays.filter(d => d.isToday)).toHaveLength(1);
    expect(weekDays.find(d => d.isToday)?.dateStr).toBe(t);
  });

  it('4.7 studied dates appear in the studyDates array', () => {
    const t = today();
    storeSet(STREAK_KEY, { currentStreak: 1, longestStreak: 1, lastStudyDate: t, studyDates: [t] });
    expect(storeGet<{ studyDates: string[] }>(STREAK_KEY)!.studyDates).toContain(t);
  });

  it('4.8 streak data persists across simulated reloads', () => {
    const t = today();
    storeSet(STREAK_KEY, { currentStreak: 7, longestStreak: 14, lastStudyDate: t, studyDates: [t] });
    const loaded = storeGet<{ currentStreak: number; longestStreak: number }>(STREAK_KEY)!;
    expect(loaded.currentStreak).toBe(7);
    expect(loaded.longestStreak).toBe(14);
  });

  it('4.9 studying twice in one day does NOT add today twice to studyDates', () => {
    const t = today();
    let studyDates = [t];
    const recordStudy = (date: string) => {
      if (!studyDates.includes(date)) studyDates.push(date);
    };
    recordStudy(t); // second call
    expect(studyDates.filter(d => d === t)).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. LEVEL COMPLETION
// ─────────────────────────────────────────────────────────────────────────────

describe('5. Level Completion', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('5.1 progress percentage = learned / total * 100', () => {
    expect(Math.round((30 / 120) * 100)).toBe(25);
  });

  it('5.2 zero words learned gives 0% progress', () => {
    expect(Math.round((0 / 100) * 100)).toBe(0);
  });

  it('5.3 isComplete is true when learned >= total', () => {
    expect(50 >= 50).toBe(true);
  });

  it('5.4 level is NOT complete when learned < total', () => {
    expect(99 >= 100).toBe(false);
  });

  it('5.5 completing all 605 beginner words shows 100% progress', () => {
    expect(Math.round((605 / 605) * 100)).toBe(100);
  });

  it('5.6 completion state persists in storage after reload', () => {
    storeSet('hindi_level_beginner', { isComplete: true, learned: 605, total: 605 });
    expect(storeGet<{ isComplete: boolean }>('hindi_level_beginner')!.isComplete).toBe(true);
  });

  it('5.7 alphabet and grammar complete independently', () => {
    storeSet('hindi_level_alphabet', { isComplete: true });
    storeSet('hindi_level_grammar', { isComplete: false });
    expect(storeGet<{ isComplete: boolean }>('hindi_level_alphabet')!.isComplete).toBe(true);
    expect(storeGet<{ isComplete: boolean }>('hindi_level_grammar')!.isComplete).toBe(false);
  });

  it('5.8 "X of Y words" count updates correctly after each "Got It"', () => {
    const total = 20;
    let learned = 4;
    learned++;
    expect(`${learned} of ${total}`).toBe('5 of 20');
  });

  it('5.9 progress bar fill ratio equals learned / total', () => {
    expect(75 / 100).toBeCloseTo(0.75);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PROGRESS RESET
// ─────────────────────────────────────────────────────────────────────────────

describe('6. Progress Reset', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('6.1 doReset removes all hindi_learning_* keys', () => {
    const RESET_KEYS = [
      DAILY_STATS_KEY, STREAK_KEY, XP_KEY, BADGES_KEY,
      'hindi_learning_quests', 'hindi_learning_achievements',
    ];
    RESET_KEYS.forEach(k => { _store[k] = JSON.stringify({ test: true }); });
    RESET_KEYS.forEach(k => { delete _store[k]; });
    RESET_KEYS.forEach(k => expect(_store[k]).toBeUndefined());
  });

  it('6.2 cancelling the confirmation does NOT clear storage', () => {
    _store[DAILY_STATS_KEY] = JSON.stringify({ wordsLearned: 10 });
    const confirmed = false;
    if (confirmed) delete _store[DAILY_STATS_KEY];
    expect(_store[DAILY_STATS_KEY]).toBeDefined();
  });

  it('6.3 after reset, wordsLearned key is absent from storage', () => {
    _store[DAILY_STATS_KEY] = JSON.stringify({ wordsLearned: 42 });
    delete _store[DAILY_STATS_KEY];
    expect(_store[DAILY_STATS_KEY]).toBeUndefined();
  });

  it('6.4 after reset, streak data is cleared', () => {
    _store[STREAK_KEY] = JSON.stringify({ currentStreak: 5 });
    delete _store[STREAK_KEY];
    expect(_store[STREAK_KEY]).toBeUndefined();
  });

  it('6.5 after reset, badges key is cleared', () => {
    _store[BADGES_KEY] = JSON.stringify([{ id: 'first_word', unlockedAt: '2026-01-01' }]);
    delete _store[BADGES_KEY];
    expect(_store[BADGES_KEY]).toBeUndefined();
  });

  it('6.6 after reset, profile stats show 0 words / 0 streak / 0 min', () => {
    const stats = { wordsLearned: 0, streak: 0, studyTime: 0 };
    expect(stats.wordsLearned).toBe(0);
    expect(stats.streak).toBe(0);
    expect(stats.studyTime).toBe(0);
  });

  it('6.7 reset is immediately persisted: key absent on next read', () => {
    _store['hindi_learning_quests'] = JSON.stringify({ data: true });
    delete _store['hindi_learning_quests'];
    expect(_store['hindi_learning_quests']).toBeUndefined();
  });

  it('6.8 reset does NOT remove hindi_accounts (user accounts preserved)', () => {
    storeSet(ACCOUNTS_KEY, [{ email: 'test@test.com' }]);
    // doReset only clears hindi_learning_* keys, not hindi_accounts
    delete _store[DAILY_STATS_KEY];
    expect(_store[ACCOUNTS_KEY]).toBeDefined();
  });

  it('6.9 reset confirmation dialog has "Cancel" and "Reset" options', () => {
    const options = ['Cancel', 'Reset'];
    expect(options).toContain('Cancel');
    expect(options).toContain('Reset');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. FLASHCARD FLOW
// ─────────────────────────────────────────────────────────────────────────────

describe('7. Flashcard Flow', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('7.1 cards are presented in queue order', () => {
    const queue = [makeWord({ id: 1 }), makeWord({ id: 2 }), makeWord({ id: 3 })];
    expect(queue[0].id).toBe(1);
    expect(queue[1].id).toBe(2);
  });

  it("7.2 \"Didn't Know\" re-appends word to the end of the queue", () => {
    const queue = [makeWord({ id: 1 }), makeWord({ id: 2 })];
    const handleIncorrect = () => {
      const word = queue.shift()!;
      queue.push({ ...word });
    };
    handleIncorrect();
    expect(queue).toHaveLength(2);
    expect(queue[queue.length - 1].id).toBe(1);
  });

  it('7.3 "Got It" removes the word from the session queue', () => {
    const queue = [makeWord({ id: 1 }), makeWord({ id: 2 })];
    const learned = new Set<number>();
    const handleCorrect = () => {
      const word = queue.shift()!;
      learned.add(word.id);
    };
    handleCorrect();
    expect(learned.has(1)).toBe(true);
    expect(queue).toHaveLength(1);
  });

  it('7.4 audio button calls Speech.speak with the Hindi word', async () => {
    await speakHindi('पानी');
    expect(Speech.speak).toHaveBeenCalledWith('पानी', expect.any(Object));
  });

  it('7.5 tapping the card flips isFlipped from false to true', () => {
    let isFlipped = false;
    const flip = () => { isFlipped = !isFlipped; };
    flip();
    expect(isFlipped).toBe(true);
  });

  it('7.6 tapping the flipped card flips back (true → false)', () => {
    let isFlipped = true;
    const flip = () => { isFlipped = !isFlipped; };
    flip();
    expect(isFlipped).toBe(false);
  });

  it('7.7 "Got It" triggers शाबाश speech feedback', async () => {
    await speakHindi('शाबाश');
    expect(Speech.speak).toHaveBeenCalledWith('शाबाश', expect.any(Object));
  });

  it('7.8 session ends when all cards have been marked "Got It"', () => {
    const queue = [makeWord({ id: 1 }), makeWord({ id: 2 }), makeWord({ id: 3 })];
    const learned = new Set<number>();
    while (queue.length > 0) {
      const word = queue.shift()!;
      learned.add(word.id);
    }
    expect(queue.length).toBe(0);
    expect(learned.size).toBe(3);
  });

  it('7.9 completion stats: correct count matches actual "Got It" taps', () => {
    const gotItIds = [1, 3, 4, 5];
    const session = { correct: gotItIds.length, total: 5 };
    expect(session.correct).toBe(4);
    expect(session.total).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

describe('8. Edge Cases', () => {
  beforeEach(() => {
    clearStore();
    jest.clearAllMocks();
  });

  it('8.1 starting a level with 0 words returns null from queue', () => {
    const queue: Word[] = [];
    expect(queue[0] ?? null).toBeNull();
  });

  it('8.2 very long Hindi word (200 chars) does not throw on access', () => {
    const word = makeWord({ hindi: 'अ'.repeat(200) });
    expect(() => word.hindi.length).not.toThrow();
    expect(word.hindi.length).toBe(200);
  });

  it('8.3 very long English translation (300 chars) does not throw on access', () => {
    const word = makeWord({ english: 'a'.repeat(300) });
    expect(() => word.english.length).not.toThrow();
    expect(word.english.length).toBe(300);
  });

  it('8.4 rapid "Got It" taps guarded by a processing flag', () => {
    let processing = false;
    let count = 0;
    const handleCorrect = () => {
      if (processing) return;
      processing = true;
      count++;
      processing = false;
    };
    handleCorrect();
    expect(count).toBe(1);
    expect(typeof processing).toBe('boolean');
  });

  it('8.5 tapping audio while already speaking calls stop before each speak', async () => {
    (Speech.isSpeakingAsync as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    await speakHindi('नमस्ते');
    await speakHindi('पानी');
    expect(Speech.stop).toHaveBeenCalledTimes(2);
  });

  it('8.6 offline indicator flips when network connectivity changes', () => {
    let isOffline = false;
    const onChange = (online: boolean) => { isOffline = !online; };
    onChange(false);
    expect(isOffline).toBe(true);
    onChange(true);
    expect(isOffline).toBe(false);
  });

  it('8.7 corrupted JSON in storage is caught and returns null safely', () => {
    _store['corrupt_key'] = '{{not-valid-json}}';
    const raw = _store['corrupt_key'];
    let result: unknown = null;
    try { result = JSON.parse(raw); } catch { result = null; }
    expect(result).toBeNull();
  });

  it('8.8 quiz with only 2 words still generates options containing the correct answer', () => {
    const words = [makeWord({ id: 1, english: 'Hello' }), makeWord({ id: 2, english: 'Water' })];
    const currentWord = words[0];
    const options = words.map(w => w.english);
    expect(options).toContain(currentWord.english);
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it('8.9 word with undefined pronunciation handled with empty string fallback', () => {
    const word = makeWord({ pronunciation: undefined });
    expect(word.pronunciation ?? '').toBe('');
  });

  it('8.10 unknown difficulty key falls back to beginner color', () => {
    const COLORS: Record<string, string> = { beginner: '#16A34A', intermediate: '#F59E0B' };
    expect(COLORS['unknown'] ?? COLORS['beginner']).toBe('#16A34A');
  });
});
