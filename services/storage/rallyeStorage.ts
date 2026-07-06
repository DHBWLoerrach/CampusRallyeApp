import { supabase } from '@/utils/Supabase';
import {
  StorageKeys,
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from './asyncStorage';
import {
  Location,
  Department,
  Rallye,
  RallyeDbRow,
  RallyeStorageRow,
  RallyeMode,
  RallyeStatus,
} from '@/types/rallye';
import { Logger } from '@/utils/Logger';

export type RallyeRow = RallyeStorageRow & { mode: RallyeMode };

export type LocationDepartmentEntry = {
  department: Department;
  rallyes: RallyeRow[];
};

export type LocationDashboardData = {
  tourModeRallye: RallyeRow | null;
  campusEventsRallyes: RallyeRow[];
  departmentEntries: LocationDepartmentEntry[];
};

type DepartmentRallyeJoin = {
  department_id: number;
  rallye_id: number;
};

// Keep the constraint minimal: only fields required for persisted app usage.
// Callers can pass richer DB rows; additional fields are preserved in the return type.
function withMode<T extends RallyeStorageRow>(
  rallye: T,
  mode: RallyeMode
): T & {
  mode: RallyeMode;
} {
  return { ...rallye, mode };
}

export async function getCurrentRallye(): Promise<RallyeRow | null> {
  const stored = (await getStorageItem(
    StorageKeys.CURRENT_RALLYE
  )) as Partial<RallyeRow> | null;
  if (!stored) return null;
  if (stored.mode !== 'tour' && stored.mode !== 'department') {
    Logger.warn('RallyeStorage', 'Discarding stored rallye with invalid mode', {
      storedMode: stored.mode,
      id: stored.id,
    });
    await removeStorageItem(StorageKeys.CURRENT_RALLYE);
    return null;
  }
  return stored as RallyeRow;
}

export async function setCurrentRallye(rallye: RallyeRow) {
  return setStorageItem(StorageKeys.CURRENT_RALLYE, rallye);
}

export async function clearCurrentRallye() {
  return removeStorageItem(StorageKeys.CURRENT_RALLYE);
}

// --- Persistente Auswahl-Speicherung ---

export async function getSelectedLocation(): Promise<Location | null> {
  return getStorageItem<Location>(StorageKeys.SELECTED_LOCATION);
}

export async function setSelectedLocation(loc: Location): Promise<void> {
  return setStorageItem(StorageKeys.SELECTED_LOCATION, loc);
}

export async function clearSelectedLocation(): Promise<void> {
  await removeStorageItem(StorageKeys.SELECTED_LOCATION);
  // Clean up stale department selection from older app versions.
  await removeStorageItem('selectedDepartment');
}

// --- Ende Persistente Auswahl-Speicherung ---

export async function getRallyeStatus(
  rallyeId: number
): Promise<RallyeStatus | null> {
  const { data, error } = await supabase
    .from('rallye')
    .select('status')
    .eq('id', rallyeId)
    .single();
  if (error) {
    Logger.error('RallyeStorage', 'Error fetching rallye status', error);
    return null;
  }
  return data?.status ?? null;
}

function isActiveRallyeStatus(
  status: RallyeStatus | null | undefined
): boolean {
  return !!status && status !== 'inactive' && status !== 'ended';
}

export async function getLocationDashboardData(
  locId: number
): Promise<LocationDashboardData> {
  Logger.debug(
    'RallyeStorage',
    `getLocationDashboardData called with locId: ${locId}`
  );

  const [tourModeRallye, locationResult, departmentsResult] = await Promise.all(
    [
      getTourModeRallyeForLocation(locId),
      supabase.from('organization').select('id, name').eq('id', locId).single(),
      supabase.from('department').select('*').eq('organization_id', locId),
    ]
  );

  const location = locationResult.data as Pick<Location, 'id' | 'name'> | null;
  if (locationResult.error || !location) {
    Logger.error(
      'RallyeStorage',
      'Error fetching location for dashboard data',
      locationResult.error
    );
    return {
      tourModeRallye,
      campusEventsRallyes: [],
      departmentEntries: [],
    };
  }

  if (departmentsResult.error) {
    Logger.error(
      'RallyeStorage',
      'Error fetching departments for dashboard data',
      departmentsResult.error
    );
    return {
      tourModeRallye,
      campusEventsRallyes: [],
      departmentEntries: [],
    };
  }

  const departments = (departmentsResult.data as Department[] | null) ?? [];
  if (departments.length === 0) {
    return {
      tourModeRallye,
      campusEventsRallyes: [],
      departmentEntries: [],
    };
  }

  const departmentIds = departments.map((department) => department.id);
  const { data: joins, error: joinsError } = await supabase
    .from('join_department_rallye')
    .select('department_id, rallye_id')
    .in('department_id', departmentIds);

  if (joinsError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching department rallye joins',
      joinsError
    );
    return {
      tourModeRallye,
      campusEventsRallyes: [],
      departmentEntries: [],
    };
  }

  const typedJoins = (joins as DepartmentRallyeJoin[] | null) ?? [];
  if (typedJoins.length === 0) {
    return {
      tourModeRallye,
      campusEventsRallyes: [],
      departmentEntries: [],
    };
  }

  const rallyeIds = [...new Set(typedJoins.map((join) => join.rallye_id))];

  if (rallyeIds.length === 0) {
    return {
      tourModeRallye,
      campusEventsRallyes: [],
      departmentEntries: [],
    };
  }

  const { data: rallyeRows, error: rallyeError } = await supabase
    .from('rallye')
    .select('*')
    .in('id', rallyeIds);

  if (rallyeError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching rallyes for dashboard data',
      rallyeError
    );
    return {
      tourModeRallye,
      campusEventsRallyes: [],
      departmentEntries: [],
    };
  }

  const activeRallyesById = new Map<number, RallyeRow>();
  (rallyeRows as RallyeDbRow[] | null)?.forEach((rallye) => {
    if (!isActiveRallyeStatus(rallye.status)) return;
    activeRallyesById.set(rallye.id, withMode(rallye, 'department'));
  });

  const rallyesByDepartment = new Map<number, RallyeRow[]>();
  typedJoins.forEach((join) => {
    const rallye = activeRallyesById.get(join.rallye_id);
    if (!rallye) return;
    const current = rallyesByDepartment.get(join.department_id) ?? [];
    current.push(rallye);
    rallyesByDepartment.set(join.department_id, current);
  });

  const campusEventsDepartment =
    departments.find((department) => department.name === location.name) ?? null;

  const campusEventsRallyes = campusEventsDepartment
    ? (rallyesByDepartment.get(campusEventsDepartment.id) ?? [])
    : [];

  const departmentEntries = departments
    .filter((department) => department.id !== campusEventsDepartment?.id)
    .map((department) => ({
      department,
      rallyes: rallyesByDepartment.get(department.id) ?? [],
    }))
    .filter((entry) => entry.rallyes.length > 0);

  return {
    tourModeRallye,
    campusEventsRallyes,
    departmentEntries,
  };
}

// --- Neue Funktionen für Mandantenfähigkeit ---

/**
 * Lädt alle Lokationen, die:
 * a) Mindestens ein Department mit einer aktiven Rallye haben, ODER
 * b) Eine default_rallye_id (Tour-Mode) gesetzt haben.
 */
export async function getLocationsWithActiveRallyes(): Promise<Location[]> {
  Logger.debug('RallyeStorage', 'getLocationsWithActiveRallyes called');

  // Schritt 1: Hole alle Joins mit Rallye-Daten
  const { data: allJoins, error: joinError } = await supabase.from(
    'join_department_rallye'
  ).select(`
      department_id,
      rallye_id,
      rallye (
        id,
        status
      )
    `);

  Logger.debug('RallyeStorage', 'join_department_rallye result', {
    allJoins,
    joinError,
  });

  if (joinError) {
    Logger.error('RallyeStorage', 'Error fetching rallye joins', joinError);
    return [];
  }

  // Debug: Zeige alle Status-Werte
  if (allJoins && allJoins.length > 0) {
    const statusValues = allJoins.map((j: any) => ({
      dept: j.department_id,
      rallye: j.rallye_id,
      status: j.rallye?.status,
      rallyeObj: j.rallye,
    }));
    Logger.debug('RallyeStorage', 'All join status values:', statusValues);
  }

  // Filtere auf aktive Rallyes (status != 'inactive' und != 'ended')
  const activeJoins =
    allJoins?.filter((j: any) => {
      const status = j.rallye?.status;
      const isActive = status && status !== 'inactive' && status !== 'ended';
      Logger.debug(
        'RallyeStorage',
        `Loc filter - dept=${j.department_id}, rallye=${j.rallye_id}, status=${status}, isActive=${isActive}`
      );
      return isActive;
    }) ?? [];

  Logger.debug(
    'RallyeStorage',
    `Active joins after filter: ${activeJoins.length}`
  );

  // Extrahiere eindeutige Department-IDs (falls vorhanden)
  const activeDepartmentIds = [
    ...new Set(activeJoins.map((j: any) => j.department_id)),
  ];
  Logger.debug('RallyeStorage', 'Active department IDs:', activeDepartmentIds);

  // Schritt 2: Hole die Departments und ihre Location-IDs (falls vorhanden)
  let locIdsWithActiveDepts: number[] = [];
  if (activeDepartmentIds.length > 0) {
    const { data: departments, error: deptError } = await supabase
      .from('department')
      .select('id, organization_id')
      .in('id', activeDepartmentIds);

    if (deptError) {
      Logger.error('RallyeStorage', 'Error fetching departments', deptError);
    } else if (departments) {
      locIdsWithActiveDepts = [
        ...new Set(departments.map((d: any) => d.organization_id)),
      ];
    }
  }

  // Schritt 3: Hole alle Lokationen mit default_rallye_id (Tour-Mode)
  // Supabase: .not('column', 'is', null) funktioniert nicht wie erwartet
  // Stattdessen holen wir alle Orgs und filtern client-seitig
  const { data: allLocs, error: allLocsError } = await supabase
    .from('organization')
    .select('id, default_rallye_id');

  Logger.debug('RallyeStorage', 'location query result', {
    allLocs,
    allLocsError,
  });

  if (allLocsError) {
    Logger.error('RallyeStorage', 'Error fetching all locations', allLocsError);
  }

  const locIdsWithTourMode = allLocs
    ? allLocs
        .filter((o: any) => o.default_rallye_id !== null)
        .map((o: any) => o.id)
    : [];

  // Schritt 4: Kombiniere beide Listen (unique)
  const allLocIds = [
    ...new Set([...locIdsWithActiveDepts, ...locIdsWithTourMode]),
  ];

  if (allLocIds.length === 0) {
    return [];
  }

  // Schritt 5: Hole die Lokationen
  const { data: locations, error: locError } = await supabase
    .from('organization')
    .select('*')
    .in('id', allLocIds);

  Logger.debug('RallyeStorage', 'Final locations result', {
    locations,
    locError,
  });

  if (locError) {
    Logger.error('RallyeStorage', 'Error fetching locations', locError);
    return [];
  }

  return (locations as Location[]) ?? [];
}

/**
 * Lädt alle Departments einer Lokation, die mindestens eine aktive Rallye haben.
 */
export async function getDepartmentsForLocation(
  locId: number
): Promise<Department[]> {
  Logger.debug(
    'RallyeStorage',
    `getDepartmentsForLocation called with locId: ${locId}`
  );

  // Schritt 1: Hole alle Joins mit Rallye-Daten
  const { data: allJoins, error: joinError } = await supabase.from(
    'join_department_rallye'
  ).select(`
      department_id,
      rallye_id,
      rallye (
        id,
        status
      )
    `);

  Logger.debug('RallyeStorage', 'join_department_rallye for getDepartments', {
    allJoins,
    joinError,
  });

  if (joinError) {
    Logger.error('RallyeStorage', 'Error fetching rallye joins', joinError);
    return [];
  }

  // Filtere auf aktive Rallyes
  const activeJoins =
    allJoins?.filter((j: any) => {
      const status = j.rallye?.status;
      const isActive = status && status !== 'inactive' && status !== 'ended';
      Logger.debug(
        'RallyeStorage',
        `Join dept=${j.department_id} rallye=${j.rallye_id}: status=${status}, isActive=${isActive}`
      );
      return isActive;
    }) ?? [];

  Logger.debug('RallyeStorage', `Active joins count: ${activeJoins.length}`);

  if (activeJoins.length === 0) {
    Logger.debug(
      'RallyeStorage',
      'No active joins found, returning empty departments'
    );
    return [];
  }

  // Extrahiere eindeutige Department-IDs mit aktiven Rallyes
  const activeDepartmentIds = [
    ...new Set(activeJoins.map((j: any) => j.department_id)),
  ];
  Logger.debug('RallyeStorage', 'Active department IDs:', activeDepartmentIds);

  // Schritt 2: Hole die Departments dieser Lokation, die in der aktiven Liste sind
  const { data: departments, error: deptError } = await supabase
    .from('department')
    .select('*')
    .eq('organization_id', locId)
    .in('id', activeDepartmentIds);

  Logger.debug('RallyeStorage', `Departments for location ${locId}:`, {
    departments,
    deptError,
  });

  if (deptError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching departments for location',
      deptError
    );
    return [];
  }

  return (departments as Department[]) ?? [];
}

/**
 * Lädt alle aktiven Rallyes für ein Department.
 */
export async function getRallyesForDepartment(
  deptId: number
): Promise<Rallye[]> {
  Logger.debug(
    'RallyeStorage',
    `getRallyesForDepartment called with deptId: ${deptId}`
  );

  // Hole alle Rallye-IDs, die diesem Department zugeordnet sind
  const { data: joins, error: joinError } = await supabase
    .from('join_department_rallye')
    .select('rallye_id')
    .eq('department_id', deptId);

  Logger.debug('RallyeStorage', 'join_department_rallye result for dept', {
    deptId,
    joins,
    joinError,
  });

  if (joinError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching rallye joins for department',
      joinError
    );
    return [];
  }

  if (!joins || joins.length === 0) {
    Logger.debug(
      'RallyeStorage',
      `No rallye joins found for deptId: ${deptId}`
    );
    return [];
  }

  const rallyeIds = joins.map((j: any) => j.rallye_id);
  Logger.debug('RallyeStorage', `Rallye IDs for dept ${deptId}:`, rallyeIds);

  // Hole die Rallyes
  const { data: allRallyes, error: rallyeError } = await supabase
    .from('rallye')
    .select('*')
    .in('id', rallyeIds);

  Logger.debug('RallyeStorage', 'All rallyes fetched:', {
    allRallyes,
    rallyeError,
  });

  if (rallyeError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching rallyes for department',
      rallyeError
    );
    return [];
  }

  // Filtere nach aktivem Status client-seitig
  const activeRallyes =
    allRallyes?.filter((r: any) => {
      const isActive =
        r.status && r.status !== 'inactive' && r.status !== 'ended';
      Logger.debug(
        'RallyeStorage',
        `Rallye ${r.id} (${r.name}): status=${r.status}, isActive=${isActive}`
      );
      return isActive;
    }) ?? [];

  Logger.debug(
    'RallyeStorage',
    `Active rallyes for dept ${deptId}:`,
    activeRallyes
  );

  return activeRallyes.map((r: RallyeDbRow) =>
    withMode(r, 'department')
  ) as Rallye[];
}

/**
 * Findet ein Department das den gleichen Namen wie die Organisation hat
 * und mindestens eine aktive Rallye hat.
 * Wird für "Campus Events" verwendet.
 */
export async function getCampusEventsDepartment(
  loc: Location
): Promise<Department | null> {
  Logger.debug(
    'RallyeStorage',
    `getCampusEventsDepartment called for location: ${loc.name}`
  );

  // Schritt 1: Suche Department mit gleichem Namen wie Location
  const { data: matchingDept, error: deptError } = await supabase
    .from('department')
    .select('*')
    .eq('organization_id', loc.id)
    .eq('name', loc.name)
    .single();

  if (deptError || !matchingDept) {
    Logger.debug(
      'RallyeStorage',
      `No department with name "${loc.name}" found for location ${loc.id}`
    );
    return null;
  }

  Logger.debug(
    'RallyeStorage',
    `Found matching department: ${matchingDept.id}`
  );

  // Schritt 2: Prüfe ob dieses Department aktive Rallyes hat
  const rallyes = await getRallyesForDepartment(matchingDept.id);

  if (rallyes.length === 0) {
    Logger.debug(
      'RallyeStorage',
      `Department "${loc.name}" has no active rallyes`
    );
    return null;
  }

  Logger.debug(
    'RallyeStorage',
    `Department "${loc.name}" has ${rallyes.length} active rallye(s)`
  );
  return matchingDept as Department;
}

/**
 * Lädt die Tour-Mode Rallye für eine Lokation.
 * Gibt null zurück, wenn keine default_rallye_id gesetzt ist oder die Rallye nicht aktiv ist.
 */
export async function getTourModeRallyeForLocation(
  locId: number
): Promise<Rallye | null> {
  // Schritt 1: Hole die default_rallye_id der Lokation
  const { data: location, error: locError } = await supabase
    .from('organization')
    .select('default_rallye_id')
    .eq('id', locId)
    .single();

  if (locError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching location for tour mode',
      locError
    );
    return null;
  }

  if (!location?.default_rallye_id) {
    // Keine Tour-Mode Rallye konfiguriert
    return null;
  }

  // Schritt 2: Hole die Rallye
  const { data: rallye, error: rallyeError } = await supabase
    .from('rallye')
    .select('*')
    .eq('id', location.default_rallye_id)
    .single();

  if (rallyeError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching tour mode rallye',
      rallyeError
    );
    return null;
  }

  // Prüfe client-seitig, ob die Rallye aktiv ist
  if (!rallye || rallye.status === 'inactive' || rallye.status === 'ended') {
    return null;
  }

  return withMode(rallye as RallyeDbRow, 'tour') as Rallye;
}
