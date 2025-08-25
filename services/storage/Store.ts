import { observable } from '@legendapp/state';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCurrentRallye } from './rallyeStorage';
import { getCurrentTeam } from './teamStorage';
import { supabase } from '@/utils/Supabase';

const OFFLINE_QUEUE_KEY = 'offlineQueue';
let syncInProgress = false;

const getOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
};

const saveOfflineQueue = async (queue: any[]) => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
  }
};

const processOfflineQueue = async () => {
  if (syncInProgress) return;

  try {
    syncInProgress = true;
    const queue = await getOfflineQueue();

    if (queue.length === 0) return;

    for (const action of queue) {
      try {
        const { error } = await supabase.from(action.table).insert(action.data).select();
        if (error) throw error;
      } catch (error) {
        console.error('Error processing offline action:', error);
        return;
      }
    }

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

export const store$ = observable({
  rallye: null as any,
  teamQuestions: [] as any[],
  enabled: false,
  questions: [] as any[],
  questionIndex: 0,
  points: 0,
  allQuestionsAnswered: false,
  answers: [] as any[],
  multipleChoiceAnswers: [] as any[],
  team: null as any,
  votingAllowed: true,
  timeExpired: false,

  currentQuestion: () => (store$.questions.get() as any[])[store$.questionIndex.get()],

  currentAnswer: () => {
    const current = store$.currentQuestion();
    if (!current) return null;
    const answers = store$.answers.get() as any[];
    return answers.filter((a) => a.question_id === current.id && a.correct === true)[0];
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

  gotoNextQuestion: () => {
    if ((store$.questions.get() as any[]).length === 0) return;
    let nextIndex = store$.questionIndex.get() + 1;
    if (nextIndex === (store$.questions.get() as any[]).length) {
      store$.allQuestionsAnswered.set(true);
      store$.questionIndex.set(0);
    } else {
      store$.questionIndex.set(nextIndex);
    }
    AsyncStorage.setItem('currentQuestionIndex', String(store$.questionIndex.get()));
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

  initialize: async () => {
    const rallye = await getCurrentRallye();
    store$.rallye.set(rallye);
    if (rallye) {
      const loadTeam = await getCurrentTeam((rallye as any).id);
      loadTeam ? store$.team.set(loadTeam) : store$.team.set(null);
    }
    const savedIndex = await AsyncStorage.getItem('currentQuestionIndex');
    if (savedIndex !== null) {
      store$.questionIndex.set(parseInt(savedIndex, 10));
    }
  },
});

store$.initialize();

