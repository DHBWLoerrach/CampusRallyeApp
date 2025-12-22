import { supabase } from '@/utils/Supabase';
import {
  StorageKeys,
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from './asyncStorage';

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

export async function getActiveRallyes(): Promise<RallyeFetchResult> {
  try {
    const { data, error } = await supabase
      .from('rallye')
      .select('*')
      .not('status', 'in', '(inactive,ended)')
      .eq('tour_mode', false);
    if (error) {
      console.error('Error fetching active rallyes:', error);
      return { data: [], error };
    }
    return { data: (data ?? []) as RallyeRow[], error: null };
  } catch (error) {
    console.error('Error fetching active rallyes:', error);
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
    console.error('Error fetching tour mode rallye:', error);
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
    console.error('Error fetching rallye status:', error);
    return null;
  }
  return data?.status ?? null;
}
