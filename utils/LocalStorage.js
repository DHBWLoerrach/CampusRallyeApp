import AsyncStorage from '@react-native-async-storage/async-storage';

export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

export const storeData = async (storageKey, value) =>{
    try {
        await AsyncStorage.setItem(storageKey, value)
        } catch(e) {
            console.log(e)
        }
}

export const deleteData = async (storageKey) => {
  try {
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.log(error);
  }
};

