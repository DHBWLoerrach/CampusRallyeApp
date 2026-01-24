import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Voting from '../voting';

const mockRpc = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: { get: jest.fn(() => ({ id: 1 })) },
    team: { get: jest.fn(() => ({ id: 2 })) },
    votingAllowed: { get: jest.fn(() => true), set: jest.fn() },
  },
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {}, muted: {} }),
}));

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

jest.mock('@/components/ui/UIButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) => <Text onPress={disabled ? undefined : onPress}>{children}</Text>,
  };
});

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Screen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

describe('Voting', () => {
  let alertSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockImplementation((name: string) => {
      if (name === 'get_voting_content') {
        return Promise.resolve({
          data: [
            {
              tq_question_id: 1,
              tq_id: 'vote-1',
              tq_team_id: 'team-1',
              rt_id: 'team-1',
              rt_team_name: 'Team A',
              question_content: 'Question 1',
              question_type: 'knowledge',
              tq_team_answer: 'Answer A',
            },
            {
              tq_question_id: 2,
              tq_id: 'vote-2',
              tq_team_id: 'team-2',
              rt_id: 'team-2',
              rt_team_name: 'Team B',
              question_content: 'Question 2',
              question_type: 'knowledge',
              tq_team_answer: 'Answer B',
            },
          ],
          error: null,
        });
      }
      if (name === 'increment_team_question_points') {
        return Promise.resolve({ error: new Error('fail') });
      }
      return Promise.resolve({ data: [], error: null });
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'voting') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() =>
              Promise.resolve({
                data: [{ question_id: 1 }, { question_id: 2 }],
                error: null,
              })
            ),
          })),
        };
      }
      if (table === 'rallye_team') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() =>
              Promise.resolve({
                data: [{ id: 1 }, { id: 2 }],
                error: null,
              })
            ),
          })),
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('shows an error and stays on the current question when submit fails', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <Voting onRefresh={jest.fn()} loading={false} />
    );

    await waitFor(() => {
      expect(getByText('Question 1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('vote-option-vote-1'));
    fireEvent.press(getByText('voting.next'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.errorTitle',
        'voting.error.submit'
      );
    });

    expect(getByText('Question 1')).toBeTruthy();
    expect(queryByText('Question 2')).toBeNull();
  });
});
