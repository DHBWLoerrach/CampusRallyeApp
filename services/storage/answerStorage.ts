import { supabase } from '@/utils/Supabase';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
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
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });
  const buffer = Buffer.from(base64, 'base64');

  // Deterministic path for idempotent retries (one photo per team/question).
  const filePath = `${teamId}_${questionId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('upload_photo_answers')
    .upload(filePath, buffer, { upsert: true, contentType: 'image/*' });
  if (uploadError) throw uploadError;

  return { filePath };
}
