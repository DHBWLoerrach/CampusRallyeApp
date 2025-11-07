import { supabase } from '@/utils/Supabase';
import { StorageKeys, getStorageItem, setStorageItem } from './asyncStorage';

export async function getCurrentRallye() {
  return getStorageItem(StorageKeys.CURRENT_RALLYE);
}

export async function setCurrentRallye(rallye: any) {
  return setStorageItem(StorageKeys.CURRENT_RALLYE, rallye);
}

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

/**
 * Interface representing a simplified Rallye Definition
 * containing only the necessary fields for checking completion status.
 */
interface RallyeDefinition {
  id: number;
  questions: unknown[]; // Using unknown[] for better type safety
  status: string;
  tour_mode: boolean;
}

/**
 * Type guard to check if an object conforms to the RallyeDefinition interface.
 * This provides runtime type safety when fetching data from external sources.
 * @param obj The object to check.
 * @returns True if the object is a RallyeDefinition, false otherwise.
 */
function isRallyeDefinition(obj: unknown): obj is RallyeDefinition {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const def = obj as RallyeDefinition; // Temporarily assert for property access
  return (
    typeof def.id === 'number' &&
    Array.isArray(def.questions) &&
    typeof def.status === 'string' &&
    typeof def.tour_mode === 'boolean'
  );
}

/**
 * Fetches all active rallye definitions, including their IDs and question arrays.
 * This is used to determine the total number of questions across all active rallies
 * for completion checks.
 *
 * @returns A promise that resolves to an array of RallyeDefinition objects.
 *          Returns an empty array if an error occurs or no active rallies are found.
 */
export async function getAllRallyeDefinitions(): Promise<RallyeDefinition[]> {
  const { data, error } = await supabase
    .from('rallye')
    // Select only the necessary columns for efficiency
    .select('id, questions, status, tour_mode')
    // Filter for active rallies (not inactive or ended) and not in tour mode
    .not('status', 'in', '(inactive,ended)')
    .eq('tour_mode', false);

  if (error) {
    console.error('Error fetching all rallye definitions:', error);
    return [];
  }

  // Filter and type-check the fetched data using the type guard.
  // The type predicate `isRallyeDefinition` ensures the compiler correctly infers the type.
  return (data ?? []).filter(isRallyeDefinition);
}