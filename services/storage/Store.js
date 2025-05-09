import { observable } from '@legendapp/state';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCurrentRallye, getCurrentTeam } from './teamStorage';

const OFFLINE_QUEUE_KEY = 'offlineQueue';
let syncInProgress = false;

// Hilfsfunktion zum Abrufen der offline Queue
const getOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
};

// Hilfsfunktion zum Speichern der offline Queue
const saveOfflineQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
  }
};

// Verarbeitung der offline Queue
const processOfflineQueue = async () => {
  if (syncInProgress) return;

  try {
    syncInProgress = true;
    const queue = await getOfflineQueue();

    if (queue.length === 0) return;

    for (const action of queue) {
      try {
        const { error } = await supabase
          .from(action.table)
          .insert(action.data)
          .select();

        if (error) throw error;
      } catch (error) {
        console.error('Error processing offline action:', error);
        return; // Bei Fehler Synchronisation abbrechen
      }
    }

    // Queue leeren nach erfolgreicher Synchronisation
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error in processOfflineQueue:', error);
  } finally {
    syncInProgress = false;
  }
};

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    processOfflineQueue();
  }
});

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
