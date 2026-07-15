import { joinRallye, startTourMode } from '../rallyeSession';
import { store$ } from '@/services/storage/Store';
import {
  setCurrentRallye,
  type RallyeRow,
} from '@/services/storage/rallyeStorage';
import {
  clearCurrentTeam,
  getCurrentTeam,
  teamExists,
} from '@/services/storage/teamStorage';
import { Logger } from '@/utils/Logger';

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { set: jest.fn() },
    rallye: { set: jest.fn() },
    enabled: { set: jest.fn() },
    reset: jest.fn(),
  },
}));

jest.mock('@/services/storage/rallyeStorage', () => ({
  setCurrentRallye: jest.fn(),
}));

jest.mock('@/services/storage/teamStorage', () => ({
  clearCurrentTeam: jest.fn(),
  getCurrentTeam: jest.fn(),
  teamExists: jest.fn(),
}));

jest.mock('@/utils/Logger', () => ({
  Logger: { error: jest.fn() },
}));

const rallye = {
  id: 7,
  name: 'Rallye',
  mode: 'department',
} as RallyeRow;
const team = { id: 3, name: 'Team' };

describe('rallyeSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(setCurrentRallye).mockResolvedValue();
    jest.mocked(getCurrentTeam).mockResolvedValue(null);
  });

  it('resets, stores, persists, and enables a joined rallye', async () => {
    await joinRallye(rallye);

    expect(store$.team.set).toHaveBeenCalledWith(null);
    expect(store$.reset).toHaveBeenCalled();
    expect(store$.rallye.set).toHaveBeenCalledWith(rallye);
    expect(setCurrentRallye).toHaveBeenCalledWith(rallye);
    expect(store$.enabled.set).toHaveBeenCalledWith(true);
  });

  it('rehydrates a stored team that still exists', async () => {
    jest.mocked(getCurrentTeam).mockResolvedValue(team);
    jest.mocked(teamExists).mockResolvedValue('exists');

    await joinRallye(rallye);

    expect(store$.team.set).toHaveBeenLastCalledWith(team);
    expect(clearCurrentTeam).not.toHaveBeenCalled();
  });

  it('clears a stored team that is definitively missing', async () => {
    jest.mocked(getCurrentTeam).mockResolvedValue(team);
    jest.mocked(teamExists).mockResolvedValue('missing');

    await joinRallye(rallye);

    expect(clearCurrentTeam).toHaveBeenCalledWith(rallye.id);
    expect(store$.team.set).toHaveBeenLastCalledWith(null);
  });

  it('keeps a stored team when existence is unknown', async () => {
    jest.mocked(getCurrentTeam).mockResolvedValue(team);
    jest.mocked(teamExists).mockResolvedValue('unknown');

    await joinRallye(rallye);

    expect(store$.team.set).toHaveBeenLastCalledWith(team);
    expect(clearCurrentTeam).not.toHaveBeenCalled();
  });

  it('clears the in-memory team but still enables when rehydration throws', async () => {
    const error = new Error('network failed');
    jest.mocked(getCurrentTeam).mockResolvedValue(team);
    jest.mocked(teamExists).mockRejectedValue(error);

    await expect(joinRallye(rallye)).resolves.toBeUndefined();

    expect(store$.team.set).toHaveBeenLastCalledWith(null);
    expect(Logger.error).toHaveBeenCalledWith(
      'RallyeSession',
      'Error rehydrating team after join',
      error
    );
    expect(store$.enabled.set).toHaveBeenCalledWith(true);
  });

  it('leaves the team null when none is stored', async () => {
    await joinRallye(rallye);

    expect(teamExists).not.toHaveBeenCalled();
    expect(store$.team.set).toHaveBeenCalledTimes(1);
    expect(store$.team.set).toHaveBeenCalledWith(null);
  });

  it('starts tour mode without a team', async () => {
    await startTourMode(rallye);

    expect(store$.team.set).toHaveBeenCalledWith(null);
    expect(store$.reset).toHaveBeenCalled();
    expect(store$.rallye.set).toHaveBeenCalledWith(rallye);
    expect(setCurrentRallye).toHaveBeenCalledWith(rallye);
    expect(store$.enabled.set).toHaveBeenCalledWith(true);
    expect(getCurrentTeam).not.toHaveBeenCalled();
  });
});
