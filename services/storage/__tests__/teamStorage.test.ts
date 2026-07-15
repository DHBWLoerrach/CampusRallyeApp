const mockFrom = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentTeam, setCurrentTeam } from '../teamStorage';

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
});
