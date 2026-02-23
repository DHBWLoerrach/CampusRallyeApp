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
import { getCurrentRallye, getOrganizationDashboardData } from '../rallyeStorage';
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

type TableHandler = (context: QueryContext) => { data: unknown; error: unknown };

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
      status: 'running',
      mode: 'invalid-mode',
    };

    await AsyncStorage.setItem(
      StorageKeys.CURRENT_RALLYE,
      JSON.stringify(invalidStoredRallye)
    );

    const result = await getCurrentRallye();

    expect(result).toBeNull();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(StorageKeys.CURRENT_RALLYE);
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

describe('rallyeStorage.getOrganizationDashboardData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns tour mode, campus events, and department rallyes in one payload', async () => {
    const orgId = 1;
    const orgName = 'DHBW Lörrach';
    const departments = [
      {
        id: 11,
        name: orgName,
        organization_id: orgId,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 12,
        name: 'Informatik',
        organization_id: orgId,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 13,
        name: 'BWL',
        organization_id: orgId,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const joins = [
      { department_id: 11, rallye_id: 101 },
      { department_id: 11, rallye_id: 102 },
      { department_id: 12, rallye_id: 201 },
      { department_id: 12, rallye_id: 202 },
      { department_id: 13, rallye_id: 301 },
    ];

    useTableHandlers({
      organization: ({ select, constraints, single }) => {
        expect(single).toBe(true);
        const orgIdFilter = constraints.find(
          (constraint) =>
            constraint.type === 'eq' && constraint.column === 'id'
        );
        expect(orgIdFilter?.value).toBe(orgId);

        if (select === 'default_rallye_id') {
          return { data: { default_rallye_id: 900 }, error: null };
        }
        if (select === 'id, name') {
          return { data: { id: orgId, name: orgName }, error: null };
        }
        return { data: null, error: new Error(`Unexpected organization select ${select}`) };
      },
      department: ({ select, constraints, single }) => {
        expect(single).toBe(false);
        expect(select).toBe('*');
        const orgFilter = constraints.find(
          (constraint) =>
            constraint.type === 'eq' && constraint.column === 'organization_id'
        );
        expect(orgFilter?.value).toBe(orgId);
        return { data: departments, error: null };
      },
      join_department_rallye: ({ select, constraints, single }) => {
        expect(single).toBe(false);
        expect(select).toBe('department_id, rallye_id');
        const departmentFilter = constraints.find(
          (constraint) =>
            constraint.type === 'in' && constraint.column === 'department_id'
        );
        expect(departmentFilter?.value).toEqual([11, 12, 13]);
        return { data: joins, error: null };
      },
      rallye: ({ constraints, single }) => {
        if (single) {
          const rallyeIdFilter = constraints.find(
            (constraint) =>
              constraint.type === 'eq' && constraint.column === 'id'
          );
          expect(rallyeIdFilter?.value).toBe(900);
          return {
            data: {
              id: 900,
              name: 'Campus Tour',
              status: 'running',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          };
        }

        return {
          data: [
            {
              id: 101,
              name: 'Campus Event 1',
              status: 'running',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 102,
              name: 'Campus Event Inactive',
              status: 'inactive',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 201,
              name: 'Info Rallye',
              status: 'running',
              password: '',
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 202,
              name: 'Info Ended',
              status: 'ended',
              password: null,
              end_time: null,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 301,
              name: 'BWL Rallye',
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

    const result = await getOrganizationDashboardData(orgId);

    expect(result.tourModeRallye).toMatchObject({
      id: 900,
      mode: 'tour',
    });
    expect(result.campusEventsRallyes.map((rallye) => rallye.id)).toEqual([101]);
    expect(result.campusEventsRallyes[0].mode).toBe('department');

    expect(result.departmentEntries.map((entry) => entry.department.id)).toEqual([
      12,
      13,
    ]);
    expect(result.departmentEntries[0].rallyes.map((rallye) => rallye.id)).toEqual([
      201,
    ]);
    expect(result.departmentEntries[1].rallyes.map((rallye) => rallye.id)).toEqual([
      301,
    ]);
    expect(result.departmentEntries[0].rallyes[0].mode).toBe('department');
  });

  it('returns empty lists when organization has no departments', async () => {
    const orgId = 2;

    useTableHandlers({
      organization: ({ select }) => {
        if (select === 'default_rallye_id') {
          return { data: { default_rallye_id: null }, error: null };
        }
        if (select === 'id, name') {
          return { data: { id: orgId, name: 'DHBW Mannheim' }, error: null };
        }
        return { data: null, error: new Error(`Unexpected organization select ${select}`) };
      },
      department: () => ({ data: [], error: null }),
    });

    const result = await getOrganizationDashboardData(orgId);

    expect(result).toEqual({
      tourModeRallye: null,
      campusEventsRallyes: [],
      departmentEntries: [],
    });
    expect(mockFrom).not.toHaveBeenCalledWith('join_department_rallye');
    expect(mockFrom).not.toHaveBeenCalledWith('rallye');
  });
});
