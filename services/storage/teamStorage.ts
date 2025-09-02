import { supabase } from '@/utils/Supabase';
import {
  StorageKeys,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from './asyncStorage';

export async function getCurrentTeam(rallyeId: number) {
  if (!rallyeId) return null;
  return getStorageItem(`${StorageKeys.TEAM}_${rallyeId}`);
}

export async function setCurrentTeam(rallyeId: number, team: any) {
  if (!rallyeId) return null;
  return setStorageItem(`${StorageKeys.TEAM}_${rallyeId}`, team);
}

// Remove the stored team assignment for a specific rallye
export async function clearCurrentTeam(rallyeId: number) {
  if (!rallyeId) return null;
  return removeStorageItem(`${StorageKeys.TEAM}_${rallyeId}`);
}

export async function setTimePlayed(rallyeId: number, teamId: number) {
  await supabase
    .from('rallye_team')
    .update({ time_played: new Date().toISOString() })
    .eq('id', teamId)
    .eq('rallye_id', rallyeId);
}

export async function createTeam(teamName: string, rallyeId: number) {
  const { data, error } = await supabase
    .from('rallye_team')
    .insert({ name: teamName, rallye_id: rallyeId })
    .select()
    .single();
  if (error) throw error;
  await setCurrentTeam(rallyeId, data);
  return data;
}

export async function getTeamsByRallye(rallyeId: number) {
  const { data, error } = await supabase
    .from('rallye_team')
    .select('*')
    .eq('rallye_id', rallyeId);
  if (error) throw error;
  return data ?? [];
}

export async function teamExists(rallyeId: number, teamId: number) {
  if (!rallyeId || !teamId) return false;
  const { data, error } = await supabase
    .from('rallye_team')
    .select('id')
    .eq('id', teamId)
    .eq('rallye_id', rallyeId)
    .maybeSingle();
  if (error) {
    console.error('Error checking team existence:', error);
    return false;
  }
  return !!data;
}
