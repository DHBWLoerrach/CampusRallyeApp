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

