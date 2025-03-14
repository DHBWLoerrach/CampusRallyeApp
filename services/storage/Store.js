import { observable } from '@legendapp/state';
import { getCurrentRallye, getCurrentTeam } from '.';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hilfsfunktion zum Abrufen der offline Queue
export const store$ = observable({
  rallye: null,
  teamQuestions: [],
  enabled: false,
  questions: [],
  questionIndex: 0,
  points: 0,
  allQuestionsAnswered: false,
  answers: [],
  multipleChoiceAnswers: [],
  team: null,
  votingAllowed: true,
  timeExpired: false,

  // Hilfsfunktionen
  currentQuestion: () => store$.questions.get()[store$.questionIndex.get()],

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
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    return shuffleArray(filtered);
  },

  gotoNextQuestion: () => {
    if (store$.questions.get().length === 0) return;
    let nextIndex = store$.questionIndex.get() + 1;
    if (nextIndex === store$.questions.get().length) {
      store$.allQuestionsAnswered.set(true);
      store$.questionIndex.set(0);
    } else {
      store$.questionIndex.set(nextIndex);
    }
    // Persistiere den aktuellen Index
    AsyncStorage.setItem(
      'currentQuestionIndex',
      String(store$.questionIndex.get())
    );
  },

  reset: () => {
    store$.questionIndex.set(0);
    store$.points.set(0);
    store$.allQuestionsAnswered.set(false);
    store$.teamQuestions.set([]);
    store$.questions.set([]);
    store$.questionIndex.set(0);
    store$.points.set(0);
    store$.answers.set([]);
    store$.timeExpired.set(false);
    store$.multipleChoiceAnswers.set([]);
    store$.votingAllowed.set(true);
  },

  // Initialisierungsfunktion
  initialize: async () => {
    const rallye = await getCurrentRallye();
    store$.rallye.set(rallye);
    if (rallye) {
      const loadTeam = await getCurrentTeam(rallye.id);
      loadTeam ? store$.team.set(loadTeam) : store$.team.set(null);
    }
    const savedIndex = await AsyncStorage.getItem('currentQuestionIndex');
    if (savedIndex !== null) {
      store$.questionIndex.set(parseInt(savedIndex, 10));
    }
  },
});

// Initialisierung
store$.initialize();
