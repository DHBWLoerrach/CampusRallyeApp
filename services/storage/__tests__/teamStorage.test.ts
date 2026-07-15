const mockFrom = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearCurrentTeam,
  createTeam,
  getCurrentTeam,
  getTeamsByRallye,
  setCurrentTeam,
  setPlayTime,
  teamExists,
} from '../teamStorage';

type QueryConstraint = {
  column: string;
  value: unknown;
};

type QueryContext = {
  table: string;
  select: string | undefined;
  insert: unknown;
  update: unknown;
  constraints: QueryConstraint[];
  terminal: 'single' | 'maybeSingle' | 'then';
};

type QueryResult = {
  data: unknown;
  error: unknown;
};

type TableHandler = (context: QueryContext) => QueryResult;

function createQueryMock(table: string, handler: TableHandler) {
  let selectValue: string | undefined;
  let insertValue: unknown;
  let updateValue: unknown;
  const constraints: QueryConstraint[] = [];

  const resolve = (terminal: QueryContext['terminal']) =>
    handler({
      table,
      select: selectValue,
      insert: insertValue,
      update: updateValue,
      constraints: [...constraints],
      terminal,
    });

  const query: {
    select: (value?: string) => typeof query;
    insert: (value: unknown) => typeof query;
    update: (value: unknown) => typeof query;
    eq: (column: string, value: unknown) => typeof query;
    single: () => Promise<QueryResult>;
    maybeSingle: () => Promise<QueryResult>;
    then: (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected: (reason?: unknown) => unknown
    ) => Promise<unknown>;
  } = {
    select: (value) => {
      selectValue = value;
      return query;
    },
    insert: (value) => {
      insertValue = value;
      return query;
    },
    update: (value) => {
      updateValue = value;
      return query;
    },
    eq: (column, value) => {
      constraints.push({ column, value });
      return query;
    },
    single: () => Promise.resolve(resolve('single')),
    maybeSingle: () => Promise.resolve(resolve('maybeSingle')),
    then: (onFulfilled, onRejected) =>
      Promise.resolve(resolve('then')).then(onFulfilled, onRejected),
  };

  return query;
}

function useTableHandlers(handlers: Record<string, TableHandler>) {
  mockFrom.mockImplementation((table: string) => {
    const handler = handlers[table];
    if (!handler) {
      throw new Error(`No handler defined for table "${table}"`);
    }
    return createQueryMock(table, handler);
  });
}

describe('teamStorage cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    useTableHandlers({});
  });

  it('makes a stored team retrievable for its rallye', async () => {
    const team = { id: 5, name: 'Team X', rallye_id: 7 };

    await setCurrentTeam(7, team);

    await expect(getCurrentTeam(7)).resolves.toEqual(team);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'team_7',
      JSON.stringify(team)
    );
  });

  it('removes the stored team for a rallye', async () => {
    const team = { id: 5, name: 'Team X', rallye_id: 7 };
    await setCurrentTeam(7, team);

    await clearCurrentTeam(7);

    await expect(getCurrentTeam(7)).resolves.toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('team_7');
  });

  it('ignores cache operations without a rallye id', async () => {
    const team = { id: 5, name: 'Team X', rallye_id: 7 };

    await expect(getCurrentTeam(0)).resolves.toBeNull();
    await expect(setCurrentTeam(0, team)).resolves.toBeNull();
    await expect(clearCurrentTeam(0)).resolves.toBeNull();

    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });
});

describe('teamStorage.createTeam', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('returns and caches a newly created team', async () => {
    const team = { id: 5, name: 'Team X', rallye_id: 7 };
    useTableHandlers({
      teams: (context) => {
        expect(context.terminal).toBe('single');
        expect(context.insert).toEqual({ name: 'Team X', rallye_id: 7 });
        return { data: team, error: null };
      },
    });

    await expect(createTeam('Team X', 7)).resolves.toEqual(team);
    await expect(getCurrentTeam(7)).resolves.toEqual(team);
  });

  it('rejects a failed creation without caching a team', async () => {
    const error = new Error('boom');
    useTableHandlers({
      teams: () => ({ data: null, error }),
    });

    await expect(createTeam('Team X', 7)).rejects.toBe(error);
    await expect(getCurrentTeam(7)).resolves.toBeNull();
  });
});

describe('teamStorage.teamExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports an existing team in its rallye', async () => {
    useTableHandlers({
      teams: (context) => {
        expect(context.select).toBe('id');
        expect(context.constraints).toEqual([
          { column: 'id', value: 5 },
          { column: 'rallye_id', value: 7 },
        ]);
        expect(context.terminal).toBe('maybeSingle');
        return { data: { id: 5 }, error: null };
      },
    });

    await expect(teamExists(7, 5)).resolves.toBe('exists');
  });

  it('reports a missing team', async () => {
    useTableHandlers({
      teams: () => ({ data: null, error: null }),
    });

    await expect(teamExists(7, 5)).resolves.toBe('missing');
  });

  it('reports an unknown result when the lookup fails', async () => {
    const error = { message: 'lookup failed' };
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    useTableHandlers({
      teams: () => ({ data: null, error }),
    });

    await expect(teamExists(7, 5)).resolves.toBe('unknown');
    expect(consoleError).toHaveBeenCalledWith(
      'Error checking team existence:',
      error
    );

    consoleError.mockRestore();
  });

  it('reports missing without a lookup when an id is absent', async () => {
    await expect(teamExists(0, 5)).resolves.toBe('missing');
    await expect(teamExists(7, 0)).resolves.toBe('missing');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('teamStorage.setPlayTime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the matching team and resolves even when Supabase reports an error', async () => {
    useTableHandlers({
      teams: (context) => {
        expect(context.terminal).toBe('then');
        expect(context.constraints).toEqual([
          { column: 'id', value: 5 },
          { column: 'rallye_id', value: 7 },
        ]);
        expect(context.update).toEqual({
          play_time: expect.any(String),
        });
        const playTime = (context.update as { play_time: string }).play_time;
        expect(new Date(playTime).getTime()).not.toBeNaN();
        return { data: null, error: { message: 'denied' } };
      },
    });

    // Intentional characterization of the current silent-failure contract.
    await expect(setPlayTime(7, 5)).resolves.toBeUndefined();
  });
});

describe('teamStorage.getTeamsByRallye', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns teams for the requested rallye', async () => {
    const teams = [
      { id: 5, name: 'Team X', rallye_id: 7 },
      { id: 6, name: 'Team Y', rallye_id: 7 },
    ];
    useTableHandlers({
      teams: (context) => {
        expect(context.select).toBe('*');
        expect(context.constraints).toEqual([
          { column: 'rallye_id', value: 7 },
        ]);
        return { data: teams, error: null };
      },
    });

    await expect(getTeamsByRallye(7)).resolves.toEqual(teams);
  });

  it('returns an empty list when Supabase has no data', async () => {
    useTableHandlers({
      teams: () => ({ data: null, error: null }),
    });

    await expect(getTeamsByRallye(7)).resolves.toEqual([]);
  });

  it('rejects when loading teams fails', async () => {
    const error = new Error('boom');
    useTableHandlers({
      teams: () => ({ data: null, error }),
    });

    await expect(getTeamsByRallye(7)).rejects.toBe(error);
  });
});
