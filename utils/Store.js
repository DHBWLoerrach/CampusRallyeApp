import { observable } from '@legendapp/state';
import { supabase } from './Supabase';
import NetInfo from '@react-native-community/netinfo';
import { queueOfflineAction, processOfflineQueue, initNetworkListener } from './OfflineSync';

// Initialisiere Network Listener
initNetworkListener(() => processOfflineQueue(supabase));

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
      const data = {
        group_id: store$.team.get().id,
        question_id: store$.currentQuestion.get().id,
        answered_correctly: answered_correctly,
        points: earned_points,
      };

      const isConnected = (await NetInfo.fetch()).isConnected;
      
      if (isConnected) {
        await supabase.from('group_questions').insert(data);
      } else {
        await queueOfflineAction({
          table: 'group_questions',
          data: data
        });
      }
    }
  },
});
