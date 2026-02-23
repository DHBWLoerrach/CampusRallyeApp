const mockFrom = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@/utils/Logger', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { StorageKeys } from '../asyncStorage';
import { getCurrentRallye } from '../rallyeStorage';
import { Logger } from '@/utils/Logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('rallyeStorage.getCurrentRallye', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('discards stored rallye with invalid mode, cleans up storage, and logs a warning', async () => {
    const invalidStoredRallye = {
      id: 42,
      name: 'Invalid Mode Rallye',
      status: 'running',
      mode: 'invalid-mode',
    };

    await AsyncStorage.setItem(
      StorageKeys.CURRENT_RALLYE,
      JSON.stringify(invalidStoredRallye)
    );

    const result = await getCurrentRallye();

    expect(result).toBeNull();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(StorageKeys.CURRENT_RALLYE);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      StorageKeys.CURRENT_RALLYE
    );
    expect(Logger.warn).toHaveBeenCalledWith(
      'RallyeStorage',
      'Discarding stored rallye with invalid mode',
      {
        storedMode: 'invalid-mode',
        id: 42,
      }
    );
    const storedAfter = await AsyncStorage.getItem(StorageKeys.CURRENT_RALLYE);
    expect(storedAfter).toBeNull();
  });

  it('discards stored rallye with missing mode, cleans up storage, and logs a warning', async () => {
    const missingModeRallye = {
      id: 99,
      name: 'Missing Mode Rallye',
      status: 'running',
    };

    await AsyncStorage.setItem(
      StorageKeys.CURRENT_RALLYE,
      JSON.stringify(missingModeRallye)
    );

    const result = await getCurrentRallye();

    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      StorageKeys.CURRENT_RALLYE
    );
    expect(Logger.warn).toHaveBeenCalledWith(
      'RallyeStorage',
      'Discarding stored rallye with invalid mode',
      {
        storedMode: undefined,
        id: 99,
      }
    );
  });
});
