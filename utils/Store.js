import { observable } from '@legendapp/state';
import { supabase } from './Supabase';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Network Listener initialisieren
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    processOfflineQueue();
  }
});

export const store$ = observable({
  rallye: null,
  team: null,
  enabled: false,
  questions: [],
  questionIndex: 0,
  points: 0,
  allQuestionsAnswered: false,
  currentQuestion: () => store$.questions.get()[store$.questionIndex.get()],
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
    try {
      // Update lokalen Punktestand
      if (answered_correctly) {
        store$.points.set(store$.points.get() + earned_points);
      }

      // Speichere Antworten nur wenn ein Team existiert
      if (store$.team.get()) {
        const data = {
          group_id: store$.team.get().id,
          question_id: store$.currentQuestion.get().id,
          answered_correctly: answered_correctly,
          points: answered_correctly ? earned_points : 0,
        };

        const networkState = await NetInfo.fetch();

        if (networkState.isConnected) {
          // Online: Direkt in Datenbank speichern
          const { error } = await supabase.from("group_questions").insert(data);

          if (error) {
            console.error("Error saving answer:", error);
            // Fallback: Offline speichern bei Fehler
            const queue = await getOfflineQueue();
            queue.push({ table: "group_questions", data });
            await saveOfflineQueue(queue);
          }
        } else {
          // Offline: Für spätere Synchronisation speichern
          const queue = await getOfflineQueue();
          queue.push({ table: "group_questions", data });
          await saveOfflineQueue(queue);
        }
      }
    } catch (error) {
      console.error("Error in savePoints:", error);
    }
  },
});
