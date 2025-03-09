import { supabase } from "../../utils/Supabase";
import { StorageKeys, getStorageItem, setStorageItem } from "./asyncStorage";

export async function getCurrentRallye() {
  return getStorageItem(StorageKeys.CURRENT_RALLYE);
}

export async function setCurrentRallye(rallye) {
  return setStorageItem(StorageKeys.CURRENT_RALLYE, rallye);
}

export async function getActiveRallyes() {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("*")
      .eq("is_active", true)
      .eq("tour_mode", false);

    if (error) throw error;

    data.forEach((rallye) => {
      if (Date.now() > new Date(rallye?.end_time).getTime()) {
        console.log("Rallye ended:", rallye.id);
        rallye.status = "ended";
      }
    });

    return data || [];
  } catch (error) {
    console.error("Error fetching active rallyes:", error);
    return [];
  }
}

export async function getTourModeRallye() {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("*")
      .eq("is_active", true)
      .eq("tour_mode", true);

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error("Error fetching tour mode rallye:", error);
    return null;
  }
}

export async function getRallyeStatus(rallyeId) {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("status")
      .eq("id", rallyeId)
      .single();

    if (error) throw error;
    return data?.status;
  } catch (error) {
    console.error("Error fetching rallye status:", error);
    return null;
  }
}
