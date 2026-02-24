/**
 * Tests for the Store observable.
 *
 * Because Store.ts has top-level side-effects (startOutbox, store$.initialize),
 * we mock the modules it calls, then import Store lazily to control timing.
 */

// --- Mock all side-effect modules BEFORE importing Store ---
jest.mock('@/services/storage/offlineOutbox', () => ({
  startOutbox: jest.fn(),
}));
jest.mock('@/services/storage/rallyeStorage', () => ({
  getCurrentRallye: jest.fn(async () => null),
  clearCurrentRallye: jest.fn(async () => {}),
}));
jest.mock('@/services/storage/teamStorage', () => ({
  getCurrentTeam: jest.fn(async () => null),
  clearCurrentTeam: jest.fn(async () => {}),
  teamExists: jest.fn(async () => 'exists'),
  setTimePlayed: jest.fn(async () => {}),
}));

import { store$ } from '@/services/storage/Store';

// Wait for the async initialize() triggered at module load to finish.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('store$ observable', () => {
  beforeEach(async () => {
    // Wait for auto-initialize, then reset to known state
    await flushPromises();
    store$.reset();
    store$.enabled.set(false);
    store$.rallye.set(null);
    store$.team.set(null);
  });

  // -- deriveSessionState (exposed via store$.sessionState) --------------------

  describe('sessionState', () => {
    it('returns not_joined when not enabled', () => {
      store$.enabled.set(false);
      expect(store$.sessionState.get()).toBe('not_joined');
    });

    it('returns not_joined when no rallye', () => {
      store$.enabled.set(true);
      store$.rallye.set(null);
      expect(store$.sessionState.get()).toBe('not_joined');
    });

    it('returns playing for an active rallye', () => {
      store$.enabled.set(true);
      store$.rallye.set({ id: 1, name: 'R', status: 'active' } as any);
      expect(store$.sessionState.get()).toBe('playing');
    });

    it('returns voting when rallye status is voting', () => {
      store$.enabled.set(true);
      store$.rallye.set({ id: 1, name: 'R', status: 'voting' } as any);
      expect(store$.sessionState.get()).toBe('voting');
    });

    it('returns finished when rallye status is ended', () => {
      store$.enabled.set(true);
      store$.rallye.set({ id: 1, name: 'R', status: 'ended' } as any);
      expect(store$.sessionState.get()).toBe('finished');
    });

    it('returns finished when rallye status is ranking', () => {
      store$.enabled.set(true);
      store$.rallye.set({ id: 1, name: 'R', status: 'ranking' } as any);
      expect(store$.sessionState.get()).toBe('finished');
    });

    it('returns finished when all questions are answered', () => {
      store$.enabled.set(true);
      store$.rallye.set({ id: 1, name: 'R', status: 'active' } as any);
      store$.allQuestionsAnswered.set(true);
      expect(store$.sessionState.get()).toBe('finished');
    });

    it('returns finished when time expired', () => {
      store$.enabled.set(true);
      store$.rallye.set({ id: 1, name: 'R', status: 'active' } as any);
      store$.timeExpired.set(true);
      expect(store$.sessionState.get()).toBe('finished');
    });
  });

  // -- reset ------------------------------------------------------------------

  describe('reset', () => {
    it('resets all gameplay observables to defaults', () => {
      store$.questionIndex.set(3);
      store$.points.set(42);
      store$.allQuestionsAnswered.set(true);
      store$.questions.set([{ id: 1 }] as any);
      store$.answers.set([{ id: 1 }] as any);
      store$.timeExpired.set(true);
      store$.votingAllowed.set(false);
      store$.totalQuestions.set(10);
      store$.answeredCount.set(5);
      store$.usedHints.set({ 1: true });

      store$.reset();

      expect(store$.questionIndex.get()).toBe(0);
      expect(store$.points.get()).toBe(0);
      expect(store$.allQuestionsAnswered.get()).toBe(false);
      expect(store$.questions.get()).toEqual([]);
      expect(store$.answers.get()).toEqual([]);
      expect(store$.timeExpired.get()).toBe(false);
      expect(store$.votingAllowed.get()).toBe(true);
      expect(store$.totalQuestions.get()).toBe(0);
      expect(store$.answeredCount.get()).toBe(0);
      expect(store$.usedHints.get()).toEqual({});
    });
  });

  // -- gotoNextQuestion -------------------------------------------------------

  describe('gotoNextQuestion', () => {
    it('does nothing when questions array is empty', async () => {
      store$.questions.set([]);
      store$.questionIndex.set(0);
      await store$.gotoNextQuestion();
      expect(store$.questionIndex.get()).toBe(0);
    });

    it('advances to the next question', async () => {
      store$.questions.set([{ id: 1 }, { id: 2 }, { id: 3 }] as any);
      store$.questionIndex.set(0);
      await store$.gotoNextQuestion();
      expect(store$.questionIndex.get()).toBe(1);
    });

    it('sets allQuestionsAnswered when reaching the last question', async () => {
      store$.questions.set([{ id: 1 }, { id: 2 }] as any);
      store$.questionIndex.set(1); // last index
      store$.rallye.set({ id: 1, name: 'R', status: 'active', mode: 'tour' } as any);

      await store$.gotoNextQuestion();

      expect(store$.allQuestionsAnswered.get()).toBe(true);
      expect(store$.questionIndex.get()).toBe(0); // wraps to 0
    });
  });

  // -- currentQuestion --------------------------------------------------------

  describe('currentQuestion', () => {
    it('returns the question at the current index', () => {
      store$.questions.set([{ id: 10 }, { id: 20 }] as any);
      store$.questionIndex.set(1);
      expect(store$.currentQuestion.get()).toEqual({ id: 20 });
    });

    it('returns undefined when questions are empty', () => {
      store$.questions.set([]);
      store$.questionIndex.set(0);
      expect(store$.currentQuestion.get()).toBeUndefined();
    });
  });

  // -- isTourMode -------------------------------------------------------------

  describe('isTourMode', () => {
    it('returns true when rallye mode is tour', () => {
      store$.rallye.set({ id: 1, name: 'R', status: 'active', mode: 'tour' } as any);
      expect(store$.isTourMode.get()).toBe(true);
    });

    it('returns false when rallye mode is not tour', () => {
      store$.rallye.set({ id: 1, name: 'R', status: 'active', mode: 'classic' } as any);
      expect(store$.isTourMode.get()).toBe(false);
    });

    it('returns falsy when no rallye', () => {
      store$.rallye.set(null);
      expect(store$.isTourMode.get()).toBeFalsy();
    });
  });
});
