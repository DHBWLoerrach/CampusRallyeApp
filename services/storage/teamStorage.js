import { supabase } from "../../utils/Supabase";
import { StorageKeys, getStorageItem, setStorageItem } from "./asyncStorage";

export async function getCurrentTeam() {
  return getStorageItem(StorageKeys.TEAM);
}

export async function setCurrentTeam(team) {
  return setStorageItem(StorageKeys.TEAM, team);
}

export async function createTeam(teamName, rallyeId) {
  try {
    const { data, error } = await supabase
      .from("rallyeTeam")
      .insert({
        name: teamName,
        rallye_id: rallyeId,
      })
      .select()
      .single();

    if (error) throw error;

    if (data) {
      await setCurrentTeam(data);
      return data;
    }
  } catch (error) {
    console.error("Error creating team:", error);
    return null;
  }
}

export async function getTeamsByRallye(rallyeId) {
  try {
    const { data, error } = await supabase
      .from("rallyeTeam")
      .select("*")
      .eq("rallye_id", rallyeId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}
