import { supabase } from "../../utils/Supabase";
import { StorageKeys, getStorageItem, setStorageItem } from "./asyncStorage";

export async function getOfflineQueue() {
  return getStorageItem(StorageKeys.OFFLINE_QUEUE) || [];
}

export async function addToOfflineQueue(action) {
  const queue = await getOfflineQueue();
  queue.push(action);
  await setStorageItem(StorageKeys.OFFLINE_QUEUE, queue);
}

export async function clearOfflineQueue() {
  await setStorageItem(StorageKeys.OFFLINE_QUEUE, []);
}

export async function saveAnswer(
  teamId,
  questionId,
  answeredCorrectly,
  points,
  answer
) {
  try {
    // Ergebnis in der Tabelle teamQuestions speichern
    const { error } = await supabase.from("teamQuestions").insert({
      team_id: teamId,
      question_id: questionId,
      correct: answeredCorrectly,
      points: points,
      team_answer: answer,
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving answer:", error);
    // Optional: Offline Queue verwenden, falls keine Verbindung besteht.
    await addToOfflineQueue({
      type: "SAVE_ANSWER",
      data: { teamId, questionId, answeredCorrectly, points },
    });
    return false;
  }
}
