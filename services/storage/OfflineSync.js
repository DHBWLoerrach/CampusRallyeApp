import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const OFFLINE_QUEUE_KEY = 'offlineQueue';

export const initNetworkListener = (syncCallback) => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncCallback();
    }
  });
};

export const queueOfflineAction = async (action) => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const actions = queue ? JSON.parse(queue) : [];
    actions.push(action);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error('Error queueing offline action:', error);
  }
};

export const processOfflineQueue = async (supabase) => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queue) return;

    const actions = JSON.parse(queue);
    for (const action of actions) {
      await supabase
        .from(action.table)
        .insert(action.data);
    }
    
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};