import { supabase } from '@/utils/Supabase';
import {
  StorageKeys,
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from './asyncStorage';
import { Organization, Department, Rallye } from '@/types/rallye';
import { Logger } from '@/utils/Logger';

export type RallyeRow = {
  id: number;
  name: string;
  password?: string | null;
  status: string;
  tour_mode: boolean;
  studiengang?: string | null;
  end_time?: string | null;
};

export type RallyeFetchResult = {
  data: RallyeRow[];
  error: unknown | null;
};

export async function getCurrentRallye(): Promise<RallyeRow | null> {
  return (await getStorageItem(StorageKeys.CURRENT_RALLYE)) as RallyeRow | null;
}

export async function setCurrentRallye(rallye: RallyeRow) {
  return setStorageItem(StorageKeys.CURRENT_RALLYE, rallye);
}

export async function clearCurrentRallye() {
  return removeStorageItem(StorageKeys.CURRENT_RALLYE);
}

// --- Persistente Auswahl-Speicherung ---

export async function getSelectedOrganization(): Promise<Organization | null> {
  return getStorageItem<Organization>(StorageKeys.SELECTED_ORGANIZATION);
}

export async function setSelectedOrganization(org: Organization): Promise<void> {
  return setStorageItem(StorageKeys.SELECTED_ORGANIZATION, org);
}

export async function clearSelectedOrganization(): Promise<void> {
  await removeStorageItem(StorageKeys.SELECTED_ORGANIZATION);
  // Wenn Organisation gelöscht wird, auch Department löschen
  await removeStorageItem(StorageKeys.SELECTED_DEPARTMENT);
}

export async function getSelectedDepartment(): Promise<Department | null> {
  return getStorageItem<Department>(StorageKeys.SELECTED_DEPARTMENT);
}

export async function setSelectedDepartment(dept: Department): Promise<void> {
  return setStorageItem(StorageKeys.SELECTED_DEPARTMENT, dept);
}

export async function clearSelectedDepartment(): Promise<void> {
  return removeStorageItem(StorageKeys.SELECTED_DEPARTMENT);
}

// --- Ende Persistente Auswahl-Speicherung ---

export async function getActiveRallyes(): Promise<RallyeFetchResult> {
  try {
    const { data, error } = await supabase
      .from('rallye')
      .select('*')
      .not('status', 'in', '(inactive,ended)')
      .eq('tour_mode', false);
    if (error) {
      Logger.error('RallyeStorage', 'Error fetching active rallyes', error);
      return { data: [], error };
    }
    return { data: (data ?? []) as RallyeRow[], error: null };
  } catch (error) {
    Logger.error('RallyeStorage', 'Error fetching active rallyes', error);
    return { data: [], error };
  }
}

export async function getTourModeRallye(): Promise<RallyeRow | null> {
  const { data, error } = await supabase
    .from('rallye')
    .select('*')
    .eq('tour_mode', true)
    .eq('status', 'running')
    .single();
  if (error) {
    Logger.error('RallyeStorage', 'Error fetching tour mode rallye', error);
    return null;
  }
  return data as RallyeRow;
}

export async function getRallyeStatus(rallyeId: number) {
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

// --- Neue Funktionen für Mandantenfähigkeit ---

/**
 * Lädt alle Organisationen, die:
 * a) Mindestens ein Department mit einer aktiven Rallye haben, ODER
 * b) Eine default_rallye_id (Tour-Mode) gesetzt haben.
 */
export async function getOrganizationsWithActiveRallyes(): Promise<Organization[]> {
  Logger.debug('RallyeStorage', 'getOrganizationsWithActiveRallyes called');
  
  // Schritt 1: Hole alle Joins mit Rallye-Daten
  const { data: allJoins, error: joinError } = await supabase
    .from('join_department_rallye')
    .select(`
      department_id,
      rallye_id,
      rallye (
        id,
        status
      )
    `);

  Logger.debug('RallyeStorage', 'join_department_rallye result', { allJoins, joinError });

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
      rallyeObj: j.rallye
    }));
    Logger.debug('RallyeStorage', 'All join status values:', statusValues);
  }

  // Filtere auf aktive Rallyes (status != 'inactive' und != 'ended')
  const activeJoins = allJoins?.filter((j: any) => {
    const status = j.rallye?.status;
    const isActive = status && status !== 'inactive' && status !== 'ended';
    Logger.debug('RallyeStorage', `Org filter - dept=${j.department_id}, rallye=${j.rallye_id}, status=${status}, isActive=${isActive}`);
    return isActive;
  }) ?? [];

  Logger.debug('RallyeStorage', `Active joins after filter: ${activeJoins.length}`);

  // Extrahiere eindeutige Department-IDs (falls vorhanden)
  const activeDepartmentIds = [...new Set(activeJoins.map((j: any) => j.department_id))];
  Logger.debug('RallyeStorage', 'Active department IDs:', activeDepartmentIds);

  // Schritt 2: Hole die Departments und ihre Organization-IDs (falls vorhanden)
  let orgIdsWithActiveDepts: number[] = [];
  if (activeDepartmentIds.length > 0) {
    const { data: departments, error: deptError } = await supabase
      .from('department')
      .select('id, organization_id')
      .in('id', activeDepartmentIds);

    if (deptError) {
      Logger.error('RallyeStorage', 'Error fetching departments', deptError);
    } else if (departments) {
      orgIdsWithActiveDepts = [...new Set(departments.map((d: any) => d.organization_id))];
    }
  }

  // Schritt 3: Hole alle Organisationen mit default_rallye_id (Tour-Mode)
  // Supabase: .not('column', 'is', null) funktioniert nicht wie erwartet
  // Stattdessen holen wir alle Orgs und filtern client-seitig
  const { data: allOrgs, error: allOrgsError } = await supabase
    .from('organization')
    .select('id, default_rallye_id');

  Logger.debug('RallyeStorage', 'organization query result', { allOrgs, allOrgsError });

  if (allOrgsError) {
    Logger.error('RallyeStorage', 'Error fetching all orgs', allOrgsError);
  }

  const orgIdsWithTourMode = allOrgs 
    ? allOrgs.filter((o: any) => o.default_rallye_id !== null).map((o: any) => o.id)
    : [];

  // Schritt 4: Kombiniere beide Listen (unique)
  const allOrgIds = [...new Set([...orgIdsWithActiveDepts, ...orgIdsWithTourMode])];

  if (allOrgIds.length === 0) {
    return [];
  }

  // Schritt 5: Hole die Organisationen
  const { data: organizations, error: orgError } = await supabase
    .from('organization')
    .select('*')
    .in('id', allOrgIds);

  Logger.debug('RallyeStorage', 'Final organizations result', { organizations, orgError });

  if (orgError) {
    Logger.error('RallyeStorage', 'Error fetching organizations', orgError);
    return [];
  }

  return (organizations as Organization[]) ?? [];
}

/**
 * Lädt alle Departments einer Organisation, die mindestens eine aktive Rallye haben.
 */
export async function getDepartmentsForOrganization(orgId: number): Promise<Department[]> {
  Logger.debug('RallyeStorage', `getDepartmentsForOrganization called with orgId: ${orgId}`);
  
  // Schritt 1: Hole alle Joins mit Rallye-Daten
  const { data: allJoins, error: joinError } = await supabase
    .from('join_department_rallye')
    .select(`
      department_id,
      rallye_id,
      rallye (
        id,
        status
      )
    `);

  Logger.debug('RallyeStorage', 'join_department_rallye for getDepartments', { allJoins, joinError });

  if (joinError) {
    Logger.error('RallyeStorage', 'Error fetching rallye joins', joinError);
    return [];
  }

  // Filtere auf aktive Rallyes
  const activeJoins = allJoins?.filter((j: any) => {
    const status = j.rallye?.status;
    const isActive = status && status !== 'inactive' && status !== 'ended';
    Logger.debug('RallyeStorage', `Join dept=${j.department_id} rallye=${j.rallye_id}: status=${status}, isActive=${isActive}`);
    return isActive;
  }) ?? [];

  Logger.debug('RallyeStorage', `Active joins count: ${activeJoins.length}`);

  if (activeJoins.length === 0) {
    Logger.debug('RallyeStorage', 'No active joins found, returning empty departments');
    return [];
  }

  // Extrahiere eindeutige Department-IDs mit aktiven Rallyes
  const activeDepartmentIds = [...new Set(activeJoins.map((j: any) => j.department_id))];
  Logger.debug('RallyeStorage', 'Active department IDs:', activeDepartmentIds);

  // Schritt 2: Hole die Departments dieser Organisation, die in der aktiven Liste sind
  const { data: departments, error: deptError } = await supabase
    .from('department')
    .select('*')
    .eq('organization_id', orgId)
    .in('id', activeDepartmentIds);

  Logger.debug('RallyeStorage', `Departments for org ${orgId}:`, { departments, deptError });

  if (deptError) {
    Logger.error('RallyeStorage', 'Error fetching departments for organization', deptError);
    return [];
  }

  return (departments as Department[]) ?? [];
}

/**
 * Lädt alle aktiven Rallyes für ein Department.
 */
export async function getRallyesForDepartment(deptId: number): Promise<Rallye[]> {
  Logger.debug('RallyeStorage', `getRallyesForDepartment called with deptId: ${deptId}`);
  
  // Hole alle Rallye-IDs, die diesem Department zugeordnet sind
  const { data: joins, error: joinError } = await supabase
    .from('join_department_rallye')
    .select('rallye_id')
    .eq('department_id', deptId);

  Logger.debug('RallyeStorage', 'join_department_rallye result for dept', { deptId, joins, joinError });

  if (joinError) {
    Logger.error('RallyeStorage', 'Error fetching rallye joins for department', joinError);
    return [];
  }

  if (!joins || joins.length === 0) {
    Logger.debug('RallyeStorage', `No rallye joins found for deptId: ${deptId}`);
    return [];
  }

  const rallyeIds = joins.map((j: any) => j.rallye_id);
  Logger.debug('RallyeStorage', `Rallye IDs for dept ${deptId}:`, rallyeIds);

  // Hole die Rallyes
  const { data: allRallyes, error: rallyeError } = await supabase
    .from('rallye')
    .select('*')
    .in('id', rallyeIds);

  Logger.debug('RallyeStorage', 'All rallyes fetched:', { allRallyes, rallyeError });

  if (rallyeError) {
    Logger.error('RallyeStorage', 'Error fetching rallyes for department', rallyeError);
    return [];
  }

  // Filtere nach aktivem Status client-seitig
  const activeRallyes = allRallyes?.filter((r: any) => {
    const isActive = r.status && r.status !== 'inactive' && r.status !== 'ended';
    Logger.debug('RallyeStorage', `Rallye ${r.id} (${r.name}): status=${r.status}, isActive=${isActive}`);
    return isActive;
  }) ?? [];

  Logger.debug('RallyeStorage', `Active rallyes for dept ${deptId}:`, activeRallyes);

  return activeRallyes as Rallye[];
}

/**
 * Findet ein Department das den gleichen Namen wie die Organisation hat
 * und mindestens eine aktive Rallye hat.
 * Wird für "Campus Events" verwendet.
 */
export async function getCampusEventsDepartment(org: Organization): Promise<Department | null> {
  Logger.debug('RallyeStorage', `getCampusEventsDepartment called for org: ${org.name}`);
  
  // Schritt 1: Suche Department mit gleichem Namen wie Organisation
  const { data: matchingDept, error: deptError } = await supabase
    .from('department')
    .select('*')
    .eq('organization_id', org.id)
    .eq('name', org.name)
    .single();

  if (deptError || !matchingDept) {
    Logger.debug('RallyeStorage', `No department with name "${org.name}" found for org ${org.id}`);
    return null;
  }

  Logger.debug('RallyeStorage', `Found matching department: ${matchingDept.id}`);

  // Schritt 2: Prüfe ob dieses Department aktive Rallyes hat
  const rallyes = await getRallyesForDepartment(matchingDept.id);
  
  if (rallyes.length === 0) {
    Logger.debug('RallyeStorage', `Department "${org.name}" has no active rallyes`);
    return null;
  }

  Logger.debug('RallyeStorage', `Department "${org.name}" has ${rallyes.length} active rallye(s)`);
  return matchingDept as Department;
}

/**
 * Lädt die Tour-Mode Rallye für eine Organisation.
 * Gibt null zurück, wenn keine default_rallye_id gesetzt ist oder die Rallye nicht aktiv ist.
 */
export async function getTourModeRallyeForOrganization(orgId: number): Promise<Rallye | null> {
  // Schritt 1: Hole die default_rallye_id der Organisation
  const { data: org, error: orgError } = await supabase
    .from('organization')
    .select('default_rallye_id')
    .eq('id', orgId)
    .single();

  if (orgError) {
    Logger.error('RallyeStorage', 'Error fetching organization for tour mode', orgError);
    return null;
  }

  if (!org?.default_rallye_id) {
    // Keine Tour-Mode Rallye konfiguriert
    return null;
  }

  // Schritt 2: Hole die Rallye
  const { data: rallye, error: rallyeError } = await supabase
    .from('rallye')
    .select('*')
    .eq('id', org.default_rallye_id)
    .single();

  if (rallyeError) {
    Logger.error('RallyeStorage', 'Error fetching tour mode rallye', rallyeError);
    return null;
  }

  // Prüfe client-seitig, ob die Rallye aktiv ist
  if (!rallye || rallye.status === 'inactive' || rallye.status === 'ended') {
    return null;
  }

  return rallye as Rallye;
}
