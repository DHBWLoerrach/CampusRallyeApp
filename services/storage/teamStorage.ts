import { supabase } from '@/utils/Supabase';
import generateTeamName from '@/utils/RandomTeamNames';
import {
  StorageKeys,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from './asyncStorage';
import { TeamCreationError } from './teamErrors';
import { normalizeTeamName, validateTeamName } from './teamNameValidation';

export type TeamExistsResult = 'exists' | 'missing' | 'unknown';
export const AUTO_TEAM_MAX_ATTEMPTS = 5;

function isDuplicateError(error: unknown): boolean {
  const maybe = error as { code?: string; message?: string };
  const message = (maybe?.message ?? '').toLowerCase();
  return maybe?.code === '23505' || message.includes('duplicate');
}

function isNetworkError(error: unknown): boolean {
  const maybe = error as { message?: string; name?: string };
  const message = (maybe?.message ?? '').toLowerCase();
  const name = (maybe?.name ?? '').toLowerCase();
  return (
    name.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection')
  );
}

function mapCreateTeamError(error: unknown): TeamCreationError {
  if (isDuplicateError(error)) {
    return new TeamCreationError('TEAM_NAME_TAKEN');
  }
  if (isNetworkError(error)) {
    return new TeamCreationError('TEAM_CREATE_NETWORK_ERROR');
  }
  return new TeamCreationError('TEAM_CREATE_UNKNOWN_ERROR');
}

async function insertTeam(teamName: string, rallyeId: number) {
  const { data, error } = await supabase
    .from('rallye_team')
    .insert({ name: teamName, rallye_id: rallyeId })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await setCurrentTeam(rallyeId, data);
  return data;
}

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
  return createTeamManual(teamName, rallyeId);
}

export async function createTeamManual(teamName: string, rallyeId: number) {
  const normalizedName = normalizeTeamName(teamName);
  const validation = validateTeamName(normalizedName);

  if (!validation.valid) {
    throw new TeamCreationError('TEAM_NAME_INVALID');
  }

  try {
    return await insertTeam(normalizedName, rallyeId);
  } catch (error) {
    throw mapCreateTeamError(error);
  }
}

export async function createTeamAuto(
  rallyeId: number,
  maxAttempts = AUTO_TEAM_MAX_ATTEMPTS
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const generatedName = normalizeTeamName(generateTeamName());
    const validation = validateTeamName(generatedName);

    if (!validation.valid) {
      continue;
    }

    try {
      return await insertTeam(generatedName, rallyeId);
    } catch (error) {
      if (isDuplicateError(error)) {
        continue;
      }
      throw mapCreateTeamError(error);
    }
  }

  throw new TeamCreationError('TEAM_AUTO_RETRY_EXHAUSTED');
}

export async function getTeamsByRallye(rallyeId: number) {
  const { data, error } = await supabase
    .from('rallye_team')
    .select('*')
    .eq('rallye_id', rallyeId);
  if (error) throw error;
  return data ?? [];
}

export async function teamExists(
  rallyeId: number,
  teamId: number
): Promise<TeamExistsResult> {
  if (!rallyeId || !teamId) return 'missing';
  const { data, error } = await supabase
    .from('rallye_team')
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
