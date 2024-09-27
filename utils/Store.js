import { observable } from '@legendapp/state';

export const store$ = observable({
  rallye: null,
  team: null,
  questions: [],
  questionIndex: 0,
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
});
