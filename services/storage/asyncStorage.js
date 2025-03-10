import AsyncStorage from "@react-native-async-storage/async-storage";

export const StorageKeys = {
  CURRENT_RALLYE: "currentRallye",
  TEAM: "team",
  OFFLINE_QUEUE: "offlineQueue",
  ANSWERS: "answers",
};

export async function getStorageItem(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return null;
  }
}

export async function setStorageItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

export async function removeStorageItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
}
