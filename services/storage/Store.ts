import { observable } from '@legendapp/state';
import { clearCurrentRallye, getCurrentRallye } from './rallyeStorage';
import {
  getCurrentTeam,
  clearCurrentTeam,
  teamExists,
  setTimePlayed,
} from './teamStorage';
import { startOutbox } from './offlineOutbox';

export type SessionState =
  | 'not_joined'
  | 'playing'
  | 'finished'
  | 'post_processing';

type SessionInputs = {
  enabled: boolean;
  rallye: any | null;
  allQuestionsAnswered: boolean;
  timeExpired: boolean;
};

function deriveSessionState({
  enabled,
  rallye,
  allQuestionsAnswered,
  timeExpired,
}: SessionInputs): SessionState {
  if (!enabled || !rallye) return 'not_joined';
  if (rallye.status === 'post_processing') return 'post_processing';
  if (rallye.status === 'ended' || allQuestionsAnswered || timeExpired)
    return 'finished';
  return 'playing';
}

// Start outbox processing once for the app lifecycle.
startOutbox();

export const store$ = observable({
  rallye: null as any,
  enabled: false,
  // When a previously joined team exists on this device, we show an explicit resume prompt.
  resumeAvailable: false,
  // Marks completion of async store initialization (used by the root layout / splash logic).
  hydrated: false,
  questions: [] as any[],
  questionIndex: 0,
  // Tracks which question IDs have had their hint used (prevents double deduction)
  usedHints: {} as Record<number, boolean>,
  // Total number of questions for the current rallye (not filtered)
  totalQuestions: 0,
  // Number of questions already answered by the team (non-tour mode)
  answeredCount: 0,
  points: 0,
  allQuestionsAnswered: false,
  answers: [] as any[],
  team: null as any,
  votingAllowed: true,
  timeExpired: false,
  teamDeleted: false,
  showTeamNameSheet: false,

  // Derived session state for resume/flow decisions.
  sessionState: () =>
    deriveSessionState({
      enabled: store$.enabled.get(),
      rallye: store$.rallye.get(),
      allQuestionsAnswered: store$.allQuestionsAnswered.get(),
      timeExpired: store$.timeExpired.get(),
    }),

  currentQuestion: () =>
    (store$.questions.get() as any[])[store$.questionIndex.get()],

  currentAnswer: () => {
    const current = store$.currentQuestion();
    if (!current) return null;
    const answers = store$.answers.get() as any[];
    return answers.filter(
      (a) => a.question_id === current.id && a.correct === true
    )[0];
  },

  currentMultipleChoiceAnswers: () => {
    const current = store$.currentQuestion();
    if (!current) return null;
    const answers = store$.answers.get() as any[];
    const filtered = answers.filter((a) => a.question_id === current.id);
    const shuffleArray = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    return shuffleArray(filtered);
  },

  gotoNextQuestion: async () => {
    if ((store$.questions.get() as any[]).length === 0) return;
    let nextIndex = store$.questionIndex.get() + 1;
    if (nextIndex === (store$.questions.get() as any[]).length) {
      store$.allQuestionsAnswered.set(true);
      store$.questionIndex.set(0);

      // Rallye beendet: Zeit speichern
      try {
        const rallye = store$.rallye.get() as any;
        const team = store$.team.get() as any;
        if (rallye && team && !rallye.tour_mode) {
          await setTimePlayed(rallye.id, team.id);
          console.log('Rallye finished, time_played set for team:', team.id);
        }
      } catch (err) {
        console.error('Error setting time_played:', err);
      }
    } else {
      store$.questionIndex.set(nextIndex);
    }
    // In team mode, advance the answered counter so the header reflects progress
    try {
      const rallye = store$.rallye.get() as any;
      if (rallye && !rallye.tour_mode) {
        const current = (store$.answeredCount.get() as number) || 0;
        const total = ((store$ as any).totalQuestions?.get?.() ?? 0) as number;
        const next = total > 0 ? Math.min(current + 1, total) : current + 1;
        (store$ as any).answeredCount.set(next);
      }
    } catch {}
    // Note: We intentionally do not persist questionIndex. Question ordering is randomized
    // on fetch; resuming by index is therefore not stable. Progress is derived from Supabase
    // `team_questions` (team mode) and in-memory state (tour mode).
  },

  reset: () => {
    store$.questionIndex.set(0);
    store$.points.set(0);
    store$.allQuestionsAnswered.set(false);
    store$.questions.set([]);
    store$.answers.set([]);
    store$.timeExpired.set(false);
    store$.votingAllowed.set(true);
    store$.totalQuestions.set(0);
    store$.answeredCount.set(0);
    store$.usedHints.set({});
  },

  leaveRallye: async () => {
    const rallye = store$.rallye.get() as any;
    try {
      if (rallye?.id) {
        // Remove local device → team assignment for this rallye.
        await clearCurrentTeam(rallye.id);
      }
      // Clear persisted "current rallye" marker so we don't offer resume again.
      await clearCurrentRallye();
    } catch (e) {
      console.error('Error leaving rallye:', e);
    } finally {
      store$.team.set(null);
      store$.rallye.set(null);
      store$.reset();
      store$.resumeAvailable.set(false);
      store$.enabled.set(false);
    }
  },

  initialize: async () => {
    try {
      const rallye = await getCurrentRallye();
      store$.rallye.set(rallye);
      store$.resumeAvailable.set(false);

      if (rallye) {
        const rallyeId = (rallye as any).id as number;
        const loadTeam = await getCurrentTeam(rallyeId);

        if (loadTeam) {
          try {
            const exists = await teamExists(rallyeId, (loadTeam as any).id);
            if (exists === 'exists') {
              store$.team.set(loadTeam);
              // Explicit resume prompt instead of auto-navigation
              if (!rallye.tour_mode) {
                store$.resumeAvailable.set(true);
              }
            } else if (exists === 'missing') {
              await clearCurrentTeam(rallyeId);
              store$.team.set(null as any);
              store$.teamDeleted.set(true);
            } else {
              store$.team.set(loadTeam);
              if (!rallye.tour_mode) store$.resumeAvailable.set(true);
            }
          } catch (e) {
            console.error('Error verifying team existence on init:', e);
            store$.team.set(loadTeam);
            if (!rallye.tour_mode) store$.resumeAvailable.set(true);
          }
        } else {
          store$.team.set(null);
        }
      }
    } finally {
      store$.hydrated.set(true);
    }
  },
});

store$.initialize();
