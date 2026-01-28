import { observable } from '@legendapp/state';
import { clearCurrentRallye, getCurrentRallye, RallyeRow } from './rallyeStorage';
import {
  getCurrentTeam,
  clearCurrentTeam,
  teamExists,
  setTimePlayed,
} from './teamStorage';
import { startOutbox } from './offlineOutbox';
import { AnswerRow, Question, Team } from '@/types/rallye';
import { Logger } from '@/utils/Logger';

export type SessionState =
  | 'not_joined'
  | 'playing'
  | 'finished'
  | 'voting';

type SessionInputs = {
  enabled: boolean;
  rallye: RallyeRow | null;
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
  if (rallye.status === 'voting') return 'voting';
  if (
    rallye.status === 'ranking' ||
    rallye.status === 'ended' ||
    allQuestionsAnswered ||
    timeExpired
  )
    return 'finished';
  return 'playing';
}

// Start outbox processing once for the app lifecycle.
startOutbox();

export const store$ = observable({
  rallye: null as RallyeRow | null,
  enabled: false,
  // When a previously joined team exists on this device, we show an explicit resume prompt.
  resumeAvailable: false,
  // Marks completion of async store initialization (used by the root layout / splash logic).
  hydrated: false,
  questions: [] as Question[],
  questionIndex: 0,
  // Tracks which question IDs have had their hint used (prevents double deduction)
  usedHints: {} as Record<number, boolean>,
  // Total number of questions for the current rallye (not filtered)
  totalQuestions: 0,
  // Number of questions already answered by the team (non-tour mode)
  answeredCount: 0,
  points: 0,
  allQuestionsAnswered: false,
  answers: [] as AnswerRow[],
  team: null as Team | null,
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
    store$.questions.get()[store$.questionIndex.get()],

  currentAnswer: () => {
    const current = store$.currentQuestion();
    if (!current) return null;
    const answers = store$.answers.get();
    return answers.filter(
      (a) => a.question_id === current.id && a.correct === true
    )[0];
  },

  currentMultipleChoiceAnswers: () => {
    const current = store$.currentQuestion();
    if (!current) return null;
    const answers = store$.answers.get();
    const filtered = answers.filter((a) => a.question_id === current.id);
    const shuffleArray = <T,>(array: T[]): T[] => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    return shuffleArray(filtered);
  },

  gotoNextQuestion: async () => {
    if (store$.questions.get().length === 0) return;
    let nextIndex = store$.questionIndex.get() + 1;
    if (nextIndex === store$.questions.get().length) {
      store$.allQuestionsAnswered.set(true);
      store$.questionIndex.set(0);

      // Rallye beendet: Zeit speichern
      try {
        const rallye = store$.rallye.get();
        const team = store$.team.get();
        if (rallye && team && rallye.mode !== 'tour') {
          await setTimePlayed(rallye.id, team.id);
          Logger.info('Store', `Rallye finished, time_played set for team: ${team.id}`);
        }
      } catch (err) {
        Logger.error('Store', 'Error setting time_played', err);
      }
    } else {
      store$.questionIndex.set(nextIndex);
    }
    // In team mode, advance the answered counter so the header reflects progress
    try {
      const rallye = store$.rallye.get();
      if (rallye && rallye.mode !== 'tour') {
        const current = store$.answeredCount.get() || 0;
        const total = store$.totalQuestions.get() ?? 0;
        const next = total > 0 ? Math.min(current + 1, total) : current + 1;
        store$.answeredCount.set(next);
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
    const rallye = store$.rallye.get();
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
      let rallye: RallyeRow | null = null;
      try {
        rallye = await getCurrentRallye();
      } catch (e) {
        console.error('Error loading stored rallye:', e);
      }
      store$.rallye.set(rallye);
      store$.resumeAvailable.set(false);

      if (rallye) {
        const rallyeId = rallye.id;
        let loadTeam: Team | null = null;
        try {
          loadTeam = await getCurrentTeam(rallyeId) as Team | null;
        } catch (e) {
          console.error('Error loading stored team:', e);
        }

        if (loadTeam) {
          try {
            const exists = await teamExists(rallyeId, loadTeam.id);
            if (exists === 'exists') {
              store$.team.set(loadTeam);
              // Explicit resume prompt instead of auto-navigation
              if (rallye.mode !== 'tour') {
                store$.resumeAvailable.set(true);
              }
            } else if (exists === 'missing') {
              await clearCurrentTeam(rallyeId);
              store$.team.set(null);
              store$.teamDeleted.set(true);
            } else {
              store$.team.set(loadTeam);
              if (rallye.mode !== 'tour') store$.resumeAvailable.set(true);
            }
          } catch (e) {
            console.error('Error verifying team existence on init:', e);
            store$.team.set(loadTeam);
            if (rallye.mode !== 'tour') store$.resumeAvailable.set(true);
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
