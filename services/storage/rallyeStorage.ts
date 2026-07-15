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
  AnswerRow,
  Question,
  TeamId,
} from '@/types/rallye';
import { Logger } from '@/utils/Logger';

export type RallyeRow = RallyeStorageRow & { mode: RallyeMode };

export type LocationDepartmentEntry = {
  department: Department;
  rallyes: RallyeRow[];
};

export type LocationDashboardData = {
  tourModeRallye: RallyeRow | null;
  departmentEntries: LocationDepartmentEntry[];
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

function isJoinableRallyeStatus(
  status: RallyeStatus | null | undefined
): boolean {
  return status === 'ready' || status === 'running';
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
    .from('rallyes')
    .select('status')
    .eq('id', rallyeId)
    .single();
  if (error) {
    Logger.error('RallyeStorage', 'Error fetching rallye status', error);
    return null;
  }
  return data?.status ?? null;
}

export async function getRallyeQuestionIds(
  rallyeId: number
): Promise<number[]> {
  const { data, error } = await supabase
    .from('rallye_questions')
    .select('question_id')
    .eq('rallye_id', rallyeId);
  if (error) throw error;
  return (data ?? []).map((row) => row.question_id);
}

export async function getSolutionOptions(
  questionIds: number[]
): Promise<AnswerRow[]> {
  const { data, error } = await supabase
    .from('solution_options')
    .select('*')
    .in('question_id', questionIds);
  if (error) throw error;
  return (data ?? []) as AnswerRow[];
}

export async function getAnsweredQuestionIds(
  teamId: TeamId
): Promise<number[]> {
  const { data, error } = await supabase
    .from('team_answers')
    .select('question_id')
    .eq('team_id', teamId);
  if (error) throw error;
  return (data ?? []).map((row) => row.question_id);
}

type QuestionDbRow = Omit<Question, 'question' | 'question_type'> & {
  content: string;
  type: Question['question_type'];
};

type GeocachingMetadata = Pick<
  Question,
  'target_latitude' | 'target_longitude' | 'proximity_radius' | 'input_type'
> & { question_id: number };

export async function getQuestionsWithGeocachingMetadata(
  questionIds: number[]
): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);
  if (error) throw error;
  const questions = (data ?? []) as QuestionDbRow[];
  const geocachingIds = questions
    .filter((question) => question.type === 'geocaching')
    .map((question) => question.id);

  let geocachingMap = new Map<number, GeocachingMetadata>();
  if (geocachingIds.length > 0) {
    const { data: metadata, error: metadataError } = await supabase
      .from('geocaching_questions')
      .select('*')
      .in('question_id', geocachingIds);
    if (metadataError) throw metadataError;
    geocachingMap = new Map(
      ((metadata ?? []) as GeocachingMetadata[]).map((row) => [
        row.question_id,
        row,
      ])
    );
  }

  return questions.map((question) => {
    const metadata = geocachingMap.get(question.id);
    return {
      ...question,
      question: question.content,
      question_type: question.type,
      ...(metadata && {
        target_latitude: metadata.target_latitude,
        target_longitude: metadata.target_longitude,
        proximity_radius: metadata.proximity_radius,
        input_type: metadata.input_type,
      }),
    };
  });
}

export async function getRallyeDynamicFields(
  rallyeId: number
): Promise<Pick<RallyeDbRow, 'status' | 'rallye_end' | 'name'> | null> {
  const { data, error } = await supabase
    .from('rallyes')
    .select('status, rallye_end, name')
    .eq('id', rallyeId)
    .single();
  if (error) {
    Logger.error(
      'RallyeStorage',
      'Error fetching dynamic rallye fields',
      error
    );
    return null;
  }
  return data;
}

export async function getLocationDashboardData(
  locId: number
): Promise<LocationDashboardData> {
  Logger.debug(
    'RallyeStorage',
    `getLocationDashboardData called with locId: ${locId}`
  );

  const [tourModeRallye, departmentsResult] = await Promise.all([
    getTourModeRallyeForLocation(locId),
    supabase.from('departments').select('*').eq('location_id', locId),
  ]);

  if (departmentsResult.error) {
    Logger.error(
      'RallyeStorage',
      'Error fetching departments for dashboard data',
      departmentsResult.error
    );
    return {
      tourModeRallye,
      departmentEntries: [],
    };
  }

  const departments = (departmentsResult.data as Department[] | null) ?? [];
  if (departments.length === 0) {
    return {
      tourModeRallye,
      departmentEntries: [],
    };
  }

  const departmentIds = departments.map((department) => department.id);
  const { data: rallyeRows, error: rallyeError } = await supabase
    .from('rallyes')
    .select('*')
    .in('department_id', departmentIds);

  if (rallyeError) {
    Logger.error(
      'RallyeStorage',
      'Error fetching rallyes for dashboard data',
      rallyeError
    );
    return {
      tourModeRallye,
      departmentEntries: [],
    };
  }

  const rallyesByDepartment = new Map<number, RallyeRow[]>();
  (rallyeRows as RallyeDbRow[] | null)?.forEach((rallye) => {
    if (!isJoinableRallyeStatus(rallye.status)) return;
    if (rallye.department_id == null) {
      Logger.warn(
        'RallyeStorage',
        'Skipping joinable rallye without department_id in dashboard mapping',
        { rallyeId: rallye.id }
      );
      return;
    }
    const current = rallyesByDepartment.get(rallye.department_id) ?? [];
    current.push(withMode(rallye, 'department'));
    rallyesByDepartment.set(rallye.department_id, current);
  });

  const departmentEntries = departments
    .map((department) => ({
      department,
      rallyes: rallyesByDepartment.get(department.id) ?? [],
    }))
    .filter((entry) => entry.rallyes.length > 0);

  return {
    tourModeRallye,
    departmentEntries,
  };
}

/**
 * Lädt alle Lokationen, die:
 * a) Mindestens ein Department mit einer beitretbaren Rallye haben, ODER
 * b) Eine default_rallye_id (Tour-Mode) gesetzt haben.
 */
export async function getLocationsWithJoinableRallyes(): Promise<Location[]> {
  Logger.debug('RallyeStorage', 'getLocationsWithJoinableRallyes called');

  const { data: allRallyes, error: rallyeError } = await supabase
    .from('rallyes')
    .select('id, status, department_id');

  if (rallyeError) {
    Logger.error('RallyeStorage', 'Error fetching rallyes', rallyeError);
    return [];
  }

  const joinableRallyes =
    (
      allRallyes as
        Pick<RallyeDbRow, 'id' | 'status' | 'department_id'>[] | null
    )?.filter((rallye) => isJoinableRallyeStatus(rallye.status)) ?? [];

  const joinableRallyeIds = new Set(joinableRallyes.map((rallye) => rallye.id));

  const joinableDepartmentIds = [
    ...new Set(
      joinableRallyes
        .map((rallye) => rallye.department_id)
        .filter((departmentId): departmentId is number => departmentId != null)
    ),
  ];

  let locIdsWithActiveDepts: number[] = [];
  if (joinableDepartmentIds.length > 0) {
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, location_id')
      .in('id', joinableDepartmentIds);

    if (deptError) {
      Logger.error('RallyeStorage', 'Error fetching departments', deptError);
    } else if (departments) {
      locIdsWithActiveDepts = [
        ...new Set(departments.map((d: any) => d.location_id)),
      ];
    }
  }

  const { data: allLocs, error: allLocsError } = await supabase
    .from('locations')
    .select('id, default_rallye_id');

  if (allLocsError) {
    Logger.error('RallyeStorage', 'Error fetching all locations', allLocsError);
  }

  const locIdsWithTourMode = allLocs
    ? allLocs
        .filter((location: any) =>
          joinableRallyeIds.has(location.default_rallye_id)
        )
        .map((location: any) => location.id)
    : [];

  const allLocIds = [
    ...new Set([...locIdsWithActiveDepts, ...locIdsWithTourMode]),
  ];

  if (allLocIds.length === 0) {
    return [];
  }

  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*')
    .in('id', allLocIds);

  if (locError) {
    Logger.error('RallyeStorage', 'Error fetching locations', locError);
    return [];
  }

  return (locations as Location[]) ?? [];
}

/**
 * Lädt die Tour-Mode Rallye für eine Lokation.
 * Gibt null zurück, wenn keine default_rallye_id gesetzt ist oder die Rallye nicht beitretbar ist.
 */
export async function getTourModeRallyeForLocation(
  locId: number
): Promise<Rallye | null> {
  const { data: location, error: locError } = await supabase
    .from('locations')
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
    return null;
  }

  const { data: rallye, error: rallyeError } = await supabase
    .from('rallyes')
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

  if (!rallye || !isJoinableRallyeStatus(rallye.status)) {
    return null;
  }

  return withMode(rallye as RallyeDbRow, 'tour') as Rallye;
}
