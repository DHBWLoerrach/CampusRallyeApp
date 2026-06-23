import React from 'react';
import { render } from '@testing-library/react-native';
import RallyeContextBar from '../RallyeContextBar';

let mockTeam: { name: string } | null = null;

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: () => mockTeam },
  },
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

describe('RallyeContextBar', () => {
  it('renders the full team name without truncation', () => {
    mockTeam = { name: 'Invincible Green Sharks with a Very Long Team Name' };

    const { getByText } = render(<RallyeContextBar />);
    const teamName = getByText(mockTeam.name);

    expect(teamName.props.numberOfLines).toBeUndefined();
    expect(teamName.props.ellipsizeMode).toBeUndefined();
  });

  it('renders nothing when no team exists', () => {
    mockTeam = null;

    const { toJSON } = render(<RallyeContextBar />);

    expect(toJSON()).toBeNull();
  });
});
