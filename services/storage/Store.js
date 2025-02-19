import { observable } from "@legendapp/state";
import { rallyeStorage } from "./RallyeStorageManager";
import { NetInfo } from "@react-native-community/netinfo";

const OFFLINE_QUEUE_KEY = "offlineQueue";
let syncInProgress = false;

// Hilfsfunktion zum Abrufen der offline Queue
const getOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error("Error reading offline queue:", error);
    return [];
  }
};

// Hilfsfunktion zum Speichern der offline Queue
const saveOfflineQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error saving offline queue:", error);
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
        console.error("Error processing offline action:", error);
        return; // Bei Fehler Synchronisation abbrechen
      }
    }

    // Queue leeren nach erfolgreicher Synchronisation
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error("Error in processOfflineQueue:", error);
  } finally {
    syncInProgress = false;
  }
};

// Network Listener initialisieren
// NetInfo.addEventListener((state) => {
//   if (state.isConnected) {
//     processOfflineQueue();
//   }
// });

export const store$ = observable({
  enabled: false,
  rallye: null,

  initialize: async () => {
    await rallyeStorage.initialize();
    const activeData = rallyeStorage.getActiveRallyeData();
    if (activeData) {
      // Stelle sicher, dass alle notwendigen Eigenschaften existieren
      store$.rallye.set({
        ...activeData,
        questions: activeData.questions || [],
        currentQuestionIndex: 0, // Setze explizit auf 0
        totalPoints: activeData.totalPoints || 0,
        team: activeData.team || null,
      });
      store$.enabled.set(true);
    } else {
      store$.rallye.set(null);
      store$.enabled.set(false);
    }
  },

  // Load a specific rallye
  loadRallye: async (rallyeId) => {
    try {
      const data = await rallyeStorage.fetchRallyeData(rallyeId);
      await rallyeStorage.setActiveRallye(rallyeId);
      store$.rallye.set(data);
      return true;
    } catch (error) {
      console.error("Error loading rallye:", error);
      return false;
    }
  },

  // Save answer for current rallye
  saveAnswer: async (questionId, answer, points) => {
    const rallye = store$.rallye.get();
    if (!rallye) return;

    await rallyeStorage.saveAnswer(rallye.id, questionId, answer, points);
    // Update observable state
    store$.rallye.set(rallyeStorage.getRallyeData(rallye.id));
  },

  createTeam: async (teamName) => {
    const rallye = store$.rallye.get();
    if (!rallye) return false;

    try {
      const { data: team, error } = await supabase
        .from("rallyeTeam")
        .insert({
          name: teamName,
          rallye_id: rallye.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (team) {
        const updatedRallye = { ...rallye, team };
        await rallyeStorage.saveRallyeData(rallye.id, updatedRallye);
        store$.rallye.set(updatedRallye);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating team:", error);
      return false;
    }
  },

  // The current rallye data
  rallye: null,
});

// Initialize on import
store$.initialize();
