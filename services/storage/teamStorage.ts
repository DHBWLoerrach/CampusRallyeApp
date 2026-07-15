import { supabase } from '@/utils/Supabase';
import type { TeamId } from '@/types/rallye';
import {
  StorageKeys,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from './asyncStorage';

export type TeamExistsResult = 'exists' | 'missing' | 'unknown';

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

export async function setPlayTime(rallyeId: number, teamId: TeamId) {
  await supabase
    .from('teams')
    .update({ play_time: new Date().toISOString() })
    .eq('id', teamId)
    .eq('rallye_id', rallyeId);
}

export async function createTeam(teamName: string, rallyeId: number) {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name: teamName, rallye_id: rallyeId })
    .select()
    .single();
  if (error) throw error;
  await setCurrentTeam(rallyeId, data);
  return data;
}

export async function getTeamsByRallye(rallyeId: number) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('rallye_id', rallyeId);
  if (error) throw error;
  return data ?? [];
}

export async function teamExists(
  rallyeId: number,
  teamId: TeamId
): Promise<TeamExistsResult> {
  if (!rallyeId || !teamId) return 'missing';
  const { data, error } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('rallye_id', rallyeId)
    .maybeSingle();
  if (error) {
    console.error('Error checking team existence:', error);
    return 'unknown';
  }
  return data ? 'exists' : 'missing';
}
