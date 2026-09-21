import { supabase } from '@/utils/Supabase';
import { enqueueSaveAnswer } from './offlineOutbox';
import { preparePhotoUpload } from './preparePhotoUpload';
import type { TeamId } from '@/types/rallye';

export type SaveAnswerResult = { status: 'sent' | 'queued' };

export async function saveAnswer(
  teamId: TeamId,
  questionId: number,
  teamPoints: number,
  answer: string = ''
): Promise<SaveAnswerResult> {
  try {
    const { error } = await supabase.from('team_answers').upsert(
      {
        team_id: teamId,
        question_id: questionId,
        team_points: teamPoints,
        answer,
      },
      { onConflict: 'team_id,question_id', ignoreDuplicates: true }
    );
    if (error) throw error;
    return { status: 'sent' };
  } catch (error) {
    console.error('Error saving answer:', error);
    try {
      await enqueueSaveAnswer({
        team_id: teamId,
        question_id: questionId,
        team_points: teamPoints,
        answer,
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
  teamId: TeamId;
  questionId: number;
}): Promise<{ filePath: string }> {
  const bytes = await preparePhotoUpload(imageUri);

  // Deterministic path for idempotent retries (one photo per team/question).
  const filePath = `${teamId}_${questionId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('upload-photos')
    .upload(filePath, bytes, { upsert: false, contentType: 'image/jpeg' });

  // Treat "already exists" as success (idempotent retry without SELECT policy)
  if (uploadError && uploadError.message !== 'The resource already exists') {
    throw uploadError;
  }

  return { filePath };
}
