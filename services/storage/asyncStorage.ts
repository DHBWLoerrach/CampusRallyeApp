import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  CURRENT_RALLYE: 'currentRallye',
  TEAM: 'team',
  OFFLINE_QUEUE: 'offlineQueue',
  SELECTED_ORGANIZATION: 'selectedOrganization',
  SELECTED_DEPARTMENT: 'selectedDepartment',
} as const;

export async function getStorageItem<T = any>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (e) {
    console.error('Error getting storage item', e);
    throw e;
  }
}

export async function setStorageItem(key: string, value: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error setting storage item', e);
    throw e;
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing storage item', e);
    throw e;
  }
}
