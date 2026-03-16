import React from 'react';
import { render } from '@testing-library/react-native';
import RallyeHeader from '../RallyeHeader';

type RenderNode = {
  props: Record<string, unknown>;
};

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

describe('RallyeHeader', () => {
  beforeEach(() => {
    mockTeam = {
      name: 'Invincible Green Sharks with a Very Long Team Name',
    };
  });

  it('truncates long team names', () => {
    const { getByText, toJSON } = render(<RallyeHeader />);
    const tree = toJSON() as RenderNode;

    const teamName = getByText(mockTeam!.name);

    expect(tree.props.style).toEqual(
      expect.objectContaining({
        width: expect.any(Number),
      })
    );
    expect(teamName.props.numberOfLines).toBe(1);
    expect(teamName.props.ellipsizeMode).toBe('tail');
  });

  it('renders nothing when no team exists', () => {
    mockTeam = null;

    const { toJSON } = render(<RallyeHeader />);

    expect(toJSON()).toBeNull();
  });
});
