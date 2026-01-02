import { supabase } from '@/utils/Supabase';
import { File } from 'expo-file-system/next';
import { enqueueSaveAnswer } from './offlineOutbox';

export type SaveAnswerResult = { status: 'sent' | 'queued' };

export async function saveAnswer(
  teamId: number,
  questionId: number,
  answeredCorrectly: boolean,
  points: number,
  answer: string = ''
): Promise<SaveAnswerResult> {
  try {
    const { error } = await supabase.from('team_questions').insert({
      team_id: teamId,
      question_id: questionId,
      correct: answeredCorrectly,
      points: points,
      team_answer: answer,
    });
    if (error) throw error;
    return { status: 'sent' };
  } catch (error) {
    console.error('Error saving answer:', error);
    try {
      await enqueueSaveAnswer({
        team_id: teamId,
        question_id: questionId,
        correct: answeredCorrectly,
        points,
        team_answer: answer,
      });
      return { status: 'queued' };
    } catch (queueError) {
      console.error('Error enqueueing offline answer:', queueError);
      throw queueError;
    }
  }
}

export async function uploadPhotoAnswer({
  imageUri,
  teamId,
  questionId,
}: {
  imageUri: string;
  teamId: number;
  questionId: number;
}): Promise<{ filePath: string }> {
  // Use the new expo-file-system File API (SDK 54+)
  const file = new File(imageUri);
  const base64 = await file.base64();
  // Convert base64 to Uint8Array for Supabase upload
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Deterministic path for idempotent retries (one photo per team/question).
  const filePath = `${teamId}_${questionId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('upload_photo_answers')
    .upload(filePath, bytes, { upsert: false, contentType: 'image/jpeg' });

  // Treat "already exists" as success (idempotent retry without SELECT policy)
  if (uploadError && uploadError.message !== 'The resource already exists') {
    throw uploadError;
  }

  return { filePath };
}
