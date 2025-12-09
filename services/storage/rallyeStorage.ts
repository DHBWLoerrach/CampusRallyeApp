import { supabase } from '@/utils/Supabase';
import { StorageKeys, getStorageItem, setStorageItem, removeStorageItem } from './asyncStorage';
import { Organization, Department, Rallye } from '@/types/rallye';

export async function getCurrentRallye() {
  return getStorageItem(StorageKeys.CURRENT_RALLYE);
}

export async function setCurrentRallye(rallye: any) {
  return setStorageItem(StorageKeys.CURRENT_RALLYE, rallye);
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

export async function getActiveRallyes() {
  const { data, error } = await supabase
    .from('rallye')
    .select('*')
    .not('status', 'in', '(inactive,ended)')
    .eq('tour_mode', false);
  if (error) {
    console.error('Error fetching active rallyes:', error);
    return [] as any[];
  }
  return data ?? [];
}

export async function getTourModeRallye() {
  const { data, error } = await supabase
    .from('rallye')
    .select('*')
    .eq('tour_mode', true)
    .eq('status', 'running')
    .single();
  if (error) {
    console.error('Error fetching tour mode rallye:', error);
    return null;
  }
  return data;
}

export async function getRallyeStatus(rallyeId: number) {
  const { data, error } = await supabase
    .from('rallye')
    .select('status')
    .eq('id', rallyeId)
    .single();
  if (error) {
    console.error('Error fetching rallye status:', error);
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
  console.log('[DEBUG] getOrganizationsWithActiveRallyes called');
  
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

  console.log('[DEBUG] join_department_rallye result:', { allJoins, joinError });

  if (joinError) {
    console.error('Error fetching rallye joins:', joinError);
  }

  // Filtere auf aktive Rallyes (status != 'inactive' und != 'ended')
  const activeJoins = allJoins?.filter((j: any) => {
    const status = j.rallye?.status;
    return status && status !== 'inactive' && status !== 'ended';
  }) ?? [];

  // Extrahiere eindeutige Department-IDs (falls vorhanden)
  const activeDepartmentIds = [...new Set(activeJoins.map((j: any) => j.department_id))];

  // Schritt 2: Hole die Departments und ihre Organization-IDs (falls vorhanden)
  let orgIdsWithActiveDepts: number[] = [];
  if (activeDepartmentIds.length > 0) {
    const { data: departments, error: deptError } = await supabase
      .from('department')
      .select('id, organization_id')
      .in('id', activeDepartmentIds);

    if (deptError) {
      console.error('Error fetching departments:', deptError);
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

  console.log('[DEBUG] organization query result:', { allOrgs, allOrgsError });

  if (allOrgsError) {
    console.error('Error fetching all orgs:', allOrgsError);
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

  console.log('[DEBUG] Final organizations result:', { organizations, orgError });

  if (orgError) {
    console.error('Error fetching organizations:', orgError);
    return [];
  }

  return (organizations as Organization[]) ?? [];
}

/**
 * Lädt alle Departments einer Organisation, die mindestens eine aktive Rallye haben.
 */
export async function getDepartmentsForOrganization(orgId: number): Promise<Department[]> {
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

  if (joinError) {
    console.error('Error fetching rallye joins:', joinError);
    return [];
  }

  // Filtere auf aktive Rallyes
  const activeJoins = allJoins?.filter((j: any) => {
    const status = j.rallye?.status;
    return status && status !== 'inactive' && status !== 'ended';
  }) ?? [];

  if (activeJoins.length === 0) {
    return [];
  }

  // Extrahiere eindeutige Department-IDs mit aktiven Rallyes
  const activeDepartmentIds = [...new Set(activeJoins.map((j: any) => j.department_id))];

  // Schritt 2: Hole die Departments dieser Organisation, die in der aktiven Liste sind
  const { data: departments, error: deptError } = await supabase
    .from('department')
    .select('*')
    .eq('organization_id', orgId)
    .in('id', activeDepartmentIds);

  if (deptError) {
    console.error('Error fetching departments for organization:', deptError);
    return [];
  }

  return (departments as Department[]) ?? [];
}

/**
 * Lädt alle aktiven Rallyes für ein Department.
 */
export async function getRallyesForDepartment(deptId: number): Promise<Rallye[]> {
  // Hole alle Rallye-IDs, die diesem Department zugeordnet sind
  const { data: joins, error: joinError } = await supabase
    .from('join_department_rallye')
    .select('rallye_id')
    .eq('department_id', deptId);

  if (joinError) {
    console.error('Error fetching rallye joins for department:', joinError);
    return [];
  }

  if (!joins || joins.length === 0) {
    return [];
  }

  const rallyeIds = joins.map((j: any) => j.rallye_id);

  // Hole die Rallyes
  const { data: allRallyes, error: rallyeError } = await supabase
    .from('rallye')
    .select('*')
    .in('id', rallyeIds);

  if (rallyeError) {
    console.error('Error fetching rallyes for department:', rallyeError);
    return [];
  }

  // Filtere nach aktivem Status client-seitig
  const activeRallyes = allRallyes?.filter((r: any) => {
    return r.status && r.status !== 'inactive' && r.status !== 'ended';
  }) ?? [];

  return activeRallyes as Rallye[];
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
    console.error('Error fetching organization for tour mode:', orgError);
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
    console.error('Error fetching tour mode rallye:', rallyeError);
    return null;
  }

  // Prüfe client-seitig, ob die Rallye aktiv ist
  if (!rallye || rallye.status === 'inactive' || rallye.status === 'ended') {
    return null;
  }

  return rallye as Rallye;
}

