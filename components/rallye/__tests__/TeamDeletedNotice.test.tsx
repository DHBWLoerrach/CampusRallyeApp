import React from 'react';
import { Alert } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { store$ } from '@/services/storage/Store';
import TeamDeletedNotice from '../TeamDeletedNotice';

jest.mock('@/services/storage/Store', () => {
  const { observable } = jest.requireActual('@legendapp/state');
  return { store$: observable({ teamDeleted: false }) };
});

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('TeamDeletedNotice', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    store$.teamDeleted.set(false);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('shows no alert while the team exists', () => {
    render(<TeamDeletedNotice />);

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows the alert once when the team gets deleted', () => {
    render(<TeamDeletedNotice />);

    act(() => {
      store$.teamDeleted.set(true);
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      'team.deleted.title',
      'team.deleted.message'
    );
    expect(store$.teamDeleted.get()).toBe(false);
  });

  it('shows the alert for a team deleted before the app became ready', () => {
    store$.teamDeleted.set(true);

    render(<TeamDeletedNotice />);

    expect(alertSpy).toHaveBeenCalledTimes(1);
  });
});
