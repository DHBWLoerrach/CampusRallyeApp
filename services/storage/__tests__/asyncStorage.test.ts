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

  // -- Happy path tests -------------------------------------------------------

  it('stores and retrieves a value via JSON round-trip', async () => {
    const data = { name: 'Test', items: [1, 2, 3] };
    await setStorageItem('myKey', data);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'myKey',
      JSON.stringify(data)
    );

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(data)
    );
    const result = await getStorageItem('myKey');
    expect(result).toEqual(data);
  });

  it('returns null for a missing key', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const result = await getStorageItem('nonexistent');
    expect(result).toBeNull();
  });

  it('calls AsyncStorage.removeItem with the correct key', async () => {
    await removeStorageItem('old-key');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('old-key');
  });
});
