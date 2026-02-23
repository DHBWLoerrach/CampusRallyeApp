import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { store$ } from '@/services/storage/Store';
import RallyeIndex from '../index';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useEffect: jest.fn(),
  };
});

jest.mock('@legendapp/state/react', () => ({
  observer: (component: any) => component,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({
    text: {},
    muted: {},
    screen: {},
  }),
}));

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
        in: async () => ({ data: [], error: null }),
      }),
    }),
  },
}));

jest.mock('@/utils/GlobalStyles', () => ({
  globalStyles: {
    default: {
      refreshContainer: {},
      container: {},
    },
    rallyeStatesStyles: {
      container: {},
      infoTitle: {},
      infoSubtitle: {},
      meetingPoint: {},
    },
  },
}));

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    ScreenScrollView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});

jest.mock('@/components/ui/InfoBox', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/VStack', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/ui/TeamNameSheet', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <View />,
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => <Text onPress={onPress}>{children}</Text>,
  };
});

jest.mock('../states/Preparation', () => () => null);
jest.mock('../states/NoQuestions', () => () => null);
jest.mock('../team-setup', () => () => null);
jest.mock('../voting', () => () => null);
jest.mock('../scoreboard', () => () => null);
jest.mock('../question-renderer', () => () => null);

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: jest.fn(() => ({
        id: 1,
        name: 'Tour Mode',
        status: 'running',
        mode: 'tour',
        end_time: null,
      })),
      status: { set: jest.fn() },
      end_time: { set: jest.fn() },
      name: { set: jest.fn() },
    },
    team: { get: jest.fn(() => null) },
    questionIndex: { get: jest.fn(() => 0), set: jest.fn() },
    questions: { get: jest.fn(() => []), set: jest.fn() },
    totalQuestions: { get: jest.fn(() => 0), set: jest.fn() },
    answeredCount: { get: jest.fn(() => 0), set: jest.fn() },
    showTeamNameSheet: { get: jest.fn(() => false), set: jest.fn() },
    currentQuestion: { get: jest.fn(() => null), set: jest.fn() },
    points: { get: jest.fn(() => 12), set: jest.fn() },
    allQuestionsAnswered: { get: jest.fn(() => true), set: jest.fn() },
    timeExpired: { get: jest.fn(() => false), set: jest.fn() },
    isTourMode: { get: jest.fn(() => true) },
    answers: { get: jest.fn(() => []), set: jest.fn() },
    leaveRallye: jest.fn(),
    reset: jest.fn(),
    enabled: { set: jest.fn() },
  },
}));

describe('RallyeIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls leaveRallye when pressing back-to-start in tour completion state', () => {
    const { getByText } = render(<RallyeIndex />);

    fireEvent.press(getByText('rallye.backToStart'));

    expect(store$.leaveRallye).toHaveBeenCalledTimes(1);
    expect(store$.reset).not.toHaveBeenCalled();
    expect(store$.enabled.set).not.toHaveBeenCalled();
  });
});
