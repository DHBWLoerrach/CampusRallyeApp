import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from '@/services/storage/asyncStorage';

describe('asyncStorage wrappers', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('throws when setStorageItem fails', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('set fail')
    );

    await expect(setStorageItem('key', { a: 1 })).rejects.toThrow('set fail');
  });

  it('throws when getStorageItem fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('get fail')
    );

    await expect(getStorageItem('key')).rejects.toThrow('get fail');
  });

  it('throws when removeStorageItem fails', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error('remove fail')
    );

    await expect(removeStorageItem('key')).rejects.toThrow('remove fail');
  });
});
