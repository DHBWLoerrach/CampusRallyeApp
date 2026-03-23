const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockSelectAfterInsert = jest.fn();
const mockSingleAfterInsert = jest.fn();
const mockSetStorageItem = jest.fn();
const mockGenerateTeamName = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('../asyncStorage', () => ({
  StorageKeys: {
    TEAM: 'team',
  },
  getStorageItem: jest.fn(),
  setStorageItem: (...args: unknown[]) => mockSetStorageItem(...args),
  removeStorageItem: jest.fn(),
}));

jest.mock('@/utils/RandomTeamNames', () => ({
  __esModule: true,
  default: () => mockGenerateTeamName(),
}));

import {
  AUTO_TEAM_MAX_ATTEMPTS,
  createTeamAuto,
  createTeamManual,
} from '../teamStorage';

function setupInsertChain() {
  mockFrom.mockReturnValue({
    insert: (...args: unknown[]) => mockInsert(...args),
  });

  mockInsert.mockReturnValue({
    select: (...args: unknown[]) => mockSelectAfterInsert(...args),
  });

  mockSelectAfterInsert.mockReturnValue({
    single: (...args: unknown[]) => mockSingleAfterInsert(...args),
  });
}

describe('teamStorage team creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupInsertChain();
  });

  it('createTeamManual creates a team and persists current team', async () => {
    mockSingleAfterInsert.mockResolvedValue({
      data: { id: 11, name: 'Team Alpha', rallye_id: 2 },
      error: null,
    });

    const result = await createTeamManual('  Team   Alpha  ', 2);

    expect(mockInsert).toHaveBeenCalledWith({
      name: 'Team Alpha',
      rallye_id: 2,
    });
    expect(mockSetStorageItem).toHaveBeenCalledWith(
      'team_2',
      result
    );
  });

  it('createTeamManual maps duplicate errors to TEAM_NAME_TAKEN', async () => {
    mockSingleAfterInsert.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    await expect(createTeamManual('Team Alpha', 3)).rejects.toMatchObject({
      code: 'TEAM_NAME_TAKEN',
    });
  });

  it('createTeamManual rejects invalid name before insert', async () => {
    await expect(createTeamManual('bad', 1)).rejects.toMatchObject({
      code: 'TEAM_NAME_INVALID',
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('createTeamAuto retries on duplicates and succeeds with later name', async () => {
    mockGenerateTeamName
      .mockReturnValueOnce('Team Alpha')
      .mockReturnValueOnce('Team Beta');

    mockSingleAfterInsert
      .mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })
      .mockResolvedValueOnce({
        data: { id: 15, name: 'Team Beta', rallye_id: 1 },
        error: null,
      });

    const result = await createTeamAuto(1);

    expect(result.name).toBe('Team Beta');
    expect(mockInsert).toHaveBeenNthCalledWith(1, {
      name: 'Team Alpha',
      rallye_id: 1,
    });
    expect(mockInsert).toHaveBeenNthCalledWith(2, {
      name: 'Team Beta',
      rallye_id: 1,
    });
  });

  it('createTeamAuto throws TEAM_AUTO_RETRY_EXHAUSTED after max attempts', async () => {
    mockGenerateTeamName.mockReturnValue('Team Alpha');
    mockSingleAfterInsert.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    await expect(createTeamAuto(7)).rejects.toMatchObject({
      code: 'TEAM_AUTO_RETRY_EXHAUSTED',
    });

    expect(mockInsert).toHaveBeenCalledTimes(AUTO_TEAM_MAX_ATTEMPTS);
  });

  it('createTeamAuto maps network failures', async () => {
    mockGenerateTeamName.mockReturnValue('Team Alpha');
    mockSingleAfterInsert.mockResolvedValue({
      data: null,
      error: { message: 'network request failed' },
    });

    await expect(createTeamAuto(4)).rejects.toMatchObject({
      code: 'TEAM_CREATE_NETWORK_ERROR',
    });
  });
});
