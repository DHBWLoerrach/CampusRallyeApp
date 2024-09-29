import { observable } from '@legendapp/state';
import { supabase } from './Supabase';

export const store$ = observable({
  rallye: null,
  team: null,
  enabled: false,
  questions: [],
  questionIndex: 0,
  points: 0,
  allQuestionsAnswered: false,
  currentQuestion: () =>
    store$.questions.get()[store$.questionIndex.get()],
  gotoNextQuestion: () => {
    if (store$.questions.get().length === 0) return;
    let nextIndex = store$.questionIndex.get() + 1;
    if (nextIndex === store$.questions.get().length) {
      store$.allQuestionsAnswered.set(true);
      store$.questionIndex.set(0);
    } else {
      store$.questionIndex.set(nextIndex);
    }
  },
  savePoints: async (answered_correctly, earned_points) => {
    if (answered_correctly) {
      store$.points.set(store$.points.get() + earned_points);
    }
    if (store$.team.get() !== null) {
      await supabase.from('group_questions').insert({
        group_id: store$.team.get().id,
        question_id: store$.currentQuestion.get().id,
        answered_correctly: answered_correctly,
        points: earned_points,
      });
    }
  },
});
