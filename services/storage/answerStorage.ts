import { supabase } from '@/utils/Supabase';
import { isMissingTeamError } from './missingTeamError';
import { enqueueSaveAnswer, getQueuedAnswers } from './offlineOutbox';
import { preparePhotoUpload } from './preparePhotoUpload';
import type { TeamId } from '@/types/rallye';

export type SaveAnswerResult = { status: 'sent' | 'queued' | 'team_missing' };

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
    // Queueing is pointless: the outbox would drop the answer anyway.
    if (isMissingTeamError(error)) return { status: 'team_missing' };
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

export type TeamProgress = {
  answeredQuestionIds: number[];
  points: number;
};

export async function getTeamProgress(teamId: TeamId): Promise<TeamProgress> {
  const { data, error } = await supabase
    .from('team_answers')
    .select('question_id, team_points')
    .eq('team_id', teamId);
  if (error) throw error;
  const rows = data ?? [];

  // Answers still waiting in the offline queue already count locally. The
  // server ignores duplicate answers, so a stored row wins over a queued one.
  const pointsByQuestion = new Map<number, number>();
  for (const answer of await getQueuedAnswers(teamId)) {
    pointsByQuestion.set(answer.question_id, answer.team_points);
  }
  for (const row of rows) {
    pointsByQuestion.set(row.question_id, row.team_points ?? 0);
  }

  let points = 0;
  for (const value of pointsByQuestion.values()) points += value;
  return {
    answeredQuestionIds: rows.map((row) => row.question_id),
    points,
  };
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
