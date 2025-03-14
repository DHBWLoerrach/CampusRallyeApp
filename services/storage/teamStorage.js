import { supabase } from '../../utils/Supabase';
import { StorageKeys, getStorageItem, setStorageItem } from './asyncStorage';

export async function getCurrentTeam(rallyeId) {
  if (!rallyeId) return null;
  return getStorageItem(StorageKeys.TEAM + '_' + rallyeId);
}

export async function setCurrentTeam(rallyeId, team) {
  if (!rallyeId) return null;
  return setStorageItem(StorageKeys.TEAM + '_' + rallyeId, team);
}

export async function setTimePlayed(rallyeId, teamId) {
  try {
    const { data, error } = await supabase
      .from('rallye_team')
      .update({ time_played: new Date() })
      .eq('id', teamId)
      .eq('rallye_id', rallyeId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating time played:', error);
    return null;
  }
}

export async function createTeam(teamName, rallyeId) {
  try {
    const { data, error } = await supabase
      .from('rallye_team')
      .insert({
        name: teamName,
        rallye_id: rallyeId,
      })
      .select()
      .single();

    if (error) throw error;

    if (data) {
      await setCurrentTeam(rallyeId, data);
      return data;
    }
  } catch (error) {
    console.error('Error creating team:', error);
    return null;
  }
}

export async function getTeamsByRallye(rallyeId) {
  try {
    const { data, error } = await supabase
      .from('rallye_team')
      .select('*')
      .eq('rallye_id', rallyeId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}
