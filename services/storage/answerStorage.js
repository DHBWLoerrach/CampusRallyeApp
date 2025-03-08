import { supabase } from "../../utils/Supabase";
import { StorageKeys, getStorageItem, setStorageItem } from "./asyncStorage";
import { store$ } from "./Store";
import { Buffer } from "buffer";

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
    // Ergebnis in der Tabelle team_questions speichern
    const { error } = await supabase.from("team_questions").insert({
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

export async function uploadPhotoAnswer(imageUri) {
  try {
    const response = await fetch(imageUri);
    const base64 = await response.blob().then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
    );
    const buffer = Buffer.from(base64, "base64");

    const teamId = store$.team.get().id;
    const questionId = store$.currentQuestion.get().id;
    const points = store$.currentQuestion.get().points;

    const fileName = `${teamId}_${questionId}_${Date.now()}.jpg`;
    const filePath = `${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from("upload_photo_answers")
      .upload(filePath, buffer, { upsert: true, contentType: "image/*" });
    if (uploadError) throw uploadError;

    await saveAnswer(teamId, questionId, true, points, filePath);

    return data;
  } catch (error) {
    console.error("Error uploading image answer:", error);

    // Offline Queue für fehlgeschlagene Foto-Uploads verwenden.
    await addToOfflineQueue({
      type: "UPLOAD_PHOTO_ANSWER",
      data: { teamId, questionId, imageUri },
    });
    return false;
  }
}
