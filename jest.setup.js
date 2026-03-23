jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true })
  ),
  addEventListener: jest.fn(),
}));

jest.mock('react-native-nfc-manager', () => ({
  __esModule: true,
  default: {
    isSupported: jest.fn(async () => true),
    start: jest.fn(async () => undefined),
    requestTechnology: jest.fn(async () => undefined),
    getTag: jest.fn(async () => ({
      id: 'mock-tag-id',
      ndefMessage: [{ payload: [2, 101, 110, 109, 111, 99, 107] }],
    })),
    cancelTechnologyRequest: jest.fn(async () => undefined),
  },
  NfcTech: {
    Ndef: 'Ndef',
  },
  Ndef: {
    text: {
      decodePayload: jest.fn(() => 'mock'),
    },
  },
}));
