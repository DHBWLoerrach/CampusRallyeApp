import AsyncStorage from '@react-native-async-storage/async-storage';

export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      try {
        return JSON.parse(value);
      } catch (jsonError) {
        console.error(`JSON Parse error for key ${key}:`, jsonError);
        // Falls der gespeicherte Wert kein JSON ist, gib den Wert als String zurück
        return value;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

export const storeData = async (storageKey, value) => {
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(value));
  } catch (e) {
    console.log(e);
  }
};
