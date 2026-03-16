jest.mock('react-native-worklets', () => ({
  __esModule: true,
  RuntimeKind: {
    ReactNative: 'ReactNative',
  },
  WorkletsModule: {},
  callMicrotasks: jest.fn(),
  createSerializable: (value) => value,
  createSynchronizable: (value) => value,
  createWorkletRuntime: jest.fn(),
  executeOnUIRuntimeSync: (fn) => fn,
  getRuntimeKind: () => 'ReactNative',
  getStaticFeatureFlag: () => false,
  isSerializableRef: () => false,
  isSynchronizable: () => false,
  isWorkletFunction: () => false,
  makeShareable: (value) => value,
  makeShareableCloneOnUIRecursive: (value) => value,
  makeShareableCloneRecursive: (value) => value,
  runOnJS: (fn) => fn,
  runOnRuntime: (fn) => fn,
  runOnUI: (fn) => fn,
  runOnUIAsync: (fn) => async (...args) => fn(...args),
  runOnUISync: (fn) => fn(),
  scheduleOnRN: (fn, ...args) => fn(...args),
  scheduleOnRuntime: (fn, ...args) => fn(...args),
  scheduleOnUI: (fn, ...args) => fn(...args),
  serializableMappingCache: new Map(),
  setDynamicFeatureFlag: jest.fn(),
  shareableMappingCache: new Map(),
  unstable_eventLoopTask: () => () => {},
}));

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
