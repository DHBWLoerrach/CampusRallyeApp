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

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
  }),
}));

jest.mock('@/utils/Colors', () => ({
  __esModule: true,
  default: {
    lightMode: {
      dhbwRed: '#E2001A',
      background: '#fcfcfc',
      text: '#000',
    },
    darkMode: {
      dhbwRed: '#E2001A',
      background: '#121214',
      text: '#fff',
    },
  },
}));

jest.mock('@/utils/AppStyles', () => ({
  useAppStyles: () => ({ text: {}, muted: {} }),
}));

jest.mock('@/utils/spacing', () => ({
  spacing: (n: number) => n * 8,
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
      if (name === 'cast_voting_vote') {
        return Promise.resolve({ 
          data: { voting_complete: false, teams_voted: 1, total_teams: 3 },
          error: new Error('fail') 
        });
      }
      return Promise.resolve({ data: [], error: null });
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'voting') {
        return {
          select: jest.fn((columns: string) => {
            // For counting questions
            if (columns === 'question_id') {
              return {
                eq: jest.fn(() =>
                  Promise.resolve({
                    data: [{ question_id: 1 }, { question_id: 2 }],
                    error: null,
                  })
                ),
              };
            }
            // For loading voting questions with question details
            return {
              eq: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      question_id: 1,
                      questions: {
                        id: 1,
                        content: 'Question 1',
                        type: 'knowledge',
                      },
                    },
                  ],
                  error: null,
                })
              ),
            };
          }),
        };
      }
      if (table === 'rallye_team') {
        return {
          select: jest.fn((columns: string) => {
            // For counting teams
            if (columns === 'id') {
              return {
                eq: jest.fn(() =>
                  Promise.resolve({
                    data: [{ id: '1' }, { id: '2' }, { id: '3' }],
                    error: null,
                  })
                ),
              };
            }
            // For loading team names
            return {
              eq: jest.fn(() => ({
                neq: jest.fn(() =>
                  Promise.resolve({
                    data: [
                      { id: 'team-1', name: 'Team A' },
                    ],
                    error: null,
                  })
                ),
              })),
            };
          }),
        };
      }
      if (table === 'team_questions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'vote-1',
                      team_answer: 'Answer A',
                    },
                    error: null,
                  })
                ),
              })),
            })),
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
