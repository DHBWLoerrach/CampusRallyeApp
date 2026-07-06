const mockFrom = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@/utils/Logger', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { StorageKeys } from '../asyncStorage';
import { getCurrentRallye, getLocationDashboardData } from '../rallyeStorage';
import { Logger } from '@/utils/Logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

type QueryConstraint = {
  type: 'eq' | 'in';
  column: string;
  value: unknown;
};

type QueryContext = {
  table: string;
  select: string | null;
  constraints: QueryConstraint[];
  single: boolean;
};

type TableHandler = (context: QueryContext) => {
  data: unknown;
  error: unknown;
};

function createQueryMock(table: string, handler: TableHandler) {
  let selectValue: string | null = null;
  const constraints: QueryConstraint[] = [];

  const query: {
    select: (value: string) => typeof query;
    eq: (column: string, value: unknown) => typeof query;
    in: (column: string, value: unknown) => typeof query;
    single: () => Promise<{ data: unknown; error: unknown }>;
    then: (
      resolve: (value: { data: unknown; error: unknown }) => unknown,
      reject: (reason?: unknown) => unknown
    ) => Promise<unknown>;
  } = {
    select: (value: string) => {
      selectValue = value;
      return query;
    },
    eq: (column: string, value: unknown) => {
      constraints.push({ type: 'eq', column, value });
      return query;
    },
    in: (column: string, value: unknown) => {
      constraints.push({ type: 'in', column, value });
      return query;
    },
    single: () =>
      Promise.resolve(
        handler({
          table,
          select: selectValue,
          constraints: [...constraints],
          single: true,
        })
      ),
    then: (resolve, reject) =>
      Promise.resolve(
        handler({
          table,
          select: selectValue,
          constraints: [...constraints],
          single: false,
        })
      ).then(resolve, reject),
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

describe('rallyeStorage.getCurrentRallye', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('discards stored rallye with invalid mode, cleans up storage, and logs a warning', async () => {
    const invalidStoredRallye = {
      id: 42,
      name: 'Invalid Mode Rallye',
      department_id: 11,
      status: 'running',
      mode: 'invalid-mode',
    };

    await AsyncStorage.setItem(
      StorageKeys.CURRENT_RALLYE,
      JSON.stringify(invalidStoredRallye)
    );

    const result = await getCurrentRallye();

    expect(result).toBeNull();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(
      StorageKeys.CURRENT_RALLYE
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      StorageKeys.CURRENT_RALLYE
    );
    expect(Logger.warn).toHaveBeenCalledWith(
      'RallyeStorage',
      'Discarding stored rallye with invalid mode',
      {
        storedMode: 'invalid-mode',
        id: 42,
      }
    );
    const storedAfter = await AsyncStorage.getItem(StorageKeys.CURRENT_RALLYE);
    expect(storedAfter).toBeNull();
  });

  it('discards stored rallye with missing mode, cleans up storage, and logs a warning', async () => {
    const missingModeRallye = {
      id: 99,
      name: 'Missing Mode Rallye',
      department_id: 12,
      status: 'running',
    };

    await AsyncStorage.setItem(
      StorageKeys.CURRENT_RALLYE,
      JSON.stringify(missingModeRallye)
    );

    const result = await getCurrentRallye();

    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      StorageKeys.CURRENT_RALLYE
    );
    expect(Logger.warn).toHaveBeenCalledWith(
      'RallyeStorage',
      'Discarding stored rallye with invalid mode',
      {
        storedMode: undefined,
        id: 99,
      }
    );
  });
});

describe('rallyeStorage.getLocationDashboardData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads tour mode and department rallyes via rallye.department_id', async () => {
    const locId = 1;
    const departments = [
      {
        id: 11,
        name: 'Informatik',
        location_id: locId,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 12,
        name: 'BWL',
        location_id: locId,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    useTableHandlers({
      location: ({ select, constraints, single }) => {
        expect(single).toBe(true);
        const locIdFilter = constraints.find(
          (constraint) => constraint.type === 'eq' && constraint.column === 'id'
        );
        expect(locIdFilter?.value).toBe(locId);

        if (select === 'default_rallye_id') {
          return { data: { default_rallye_id: 900 }, error: null };
        }

        return {
          data: null,
          error: new Error(`Unexpected location select ${select}`),
        };
      },
      department: ({ select, constraints, single }) => {
        expect(single).toBe(false);
        expect(select).toBe('*');
        const locFilter = constraints.find(
          (constraint) =>
            constraint.type === 'eq' && constraint.column === 'location_id'
        );
        expect(locFilter?.value).toBe(locId);
        return { data: departments, error: null };
      },
      rallye: ({ select, constraints, single }) => {
        if (single) {
          expect(select).toBe('*');
          const rallyeIdFilter = constraints.find(
            (constraint) => constraint.type === 'eq' && constraint.column === 'id'
          );
          expect(rallyeIdFilter?.value).toBe(900);
          return {
            data: {
              id: 900,
              name: 'Campus Tour',
              department_id: 11,
              status: 'running',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          };
        }

        expect(select).toBe('*');
        const departmentFilter = constraints.find(
          (constraint) =>
            constraint.type === 'in' && constraint.column === 'department_id'
        );
        expect(departmentFilter?.value).toEqual([11, 12]);

        return {
          data: [
            {
              id: 101,
              name: 'Info Rallye',
              department_id: 11,
              status: 'running',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 102,
              name: 'Info Rallye Inactive',
              department_id: 11,
              status: 'inactive',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 201,
              name: 'BWL Rallye',
              department_id: 12,
              status: 'running',
              password: 'secret',
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        };
      },
    });

    const result = await getLocationDashboardData(locId);

    expect(result.tourModeRallye).toMatchObject({
      id: 900,
      mode: 'tour',
    });
    expect(
      result.departmentEntries.map((entry) => ({
        departmentId: entry.department.id,
        rallyeIds: entry.rallyes.map((rallye) => rallye.id),
      }))
    ).toEqual([
      { departmentId: 11, rallyeIds: [101] },
      { departmentId: 12, rallyeIds: [201] },
    ]);
    expect(result.departmentEntries[0].rallyes[0].mode).toBe('department');
    expect(mockFrom).not.toHaveBeenCalledWith('join_department_rallye');
  });

  it('skips active rallyes without department_id and logs warning', async () => {
    const locId = 3;

    useTableHandlers({
      location: ({ select }) => {
        if (select === 'default_rallye_id') {
          return { data: { default_rallye_id: null }, error: null };
        }

        return {
          data: null,
          error: new Error(`Unexpected location select ${select}`),
        };
      },
      department: () => ({
        data: [
          {
            id: 10,
            name: 'Informatik',
            location_id: locId,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      }),
      rallye: ({ single }) => {
        if (single) {
          return { data: null, error: null };
        }
        return {
          data: [
            {
              id: 555,
              name: 'Broken Rallye',
              department_id: null,
              status: 'running',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        };
      },
    });

    const result = await getLocationDashboardData(locId);

    expect(result.departmentEntries).toEqual([]);
    expect(Logger.warn).toHaveBeenCalledWith(
      'RallyeStorage',
      'Skipping active rallye without department_id in dashboard mapping',
      { rallyeId: 555 }
    );
  });
});
