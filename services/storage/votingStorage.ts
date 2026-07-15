import { supabase } from '@/utils/Supabase';
import type { TeamId } from '@/types/rallye';

export type VotingQuestionJoinRow = {
  question_id: number;
  questions:
    | { id: number; content: string | null; type: string | null }
    | { id: number; content: string | null; type: string | null }[]
    | null;
};

export type VotingTeamRow = {
  id: TeamId;
  name?: string | null;
  team_name?: string | null;
};

export type VotingTeamAnswerRow = {
  question_id: number;
  team_id: TeamId;
  answer: string | null;
};

export type VotedQuestionRow = { question_id: number };

export async function getVotingSourceData(rallyeId: number, teamId: TeamId) {
  const [questionResponse, teamResponse, votedQuestionResponse] =
    await Promise.all([
      supabase
        .from('rallye_questions')
        .select('question_id, questions!inner(id, content, type)')
        .eq('rallye_id', rallyeId)
        .eq('is_voting', true),
      supabase.from('teams').select('id, name').eq('rallye_id', rallyeId),
      supabase.rpc('get_voted_voting_question_ids', {
        rallye_id_param: rallyeId,
        voting_team_id_param: teamId,
      }),
    ]);

  if (questionResponse.error) throw questionResponse.error;
  if (teamResponse.error) throw teamResponse.error;
  if (votedQuestionResponse.error) throw votedQuestionResponse.error;

  return {
    questionRows: (questionResponse.data ?? []) as VotingQuestionJoinRow[],
    teamRows: (teamResponse.data ?? []) as VotingTeamRow[],
    votedQuestionRows: (votedQuestionResponse.data ?? []) as VotedQuestionRow[],
  };
}

export async function getTeamAnswersForQuestions(
  questionIds: number[],
  teamIds: TeamId[]
): Promise<VotingTeamAnswerRow[]> {
  const { data, error } = await supabase
    .from('team_answers')
    .select('question_id, team_id, answer')
    .in('question_id', questionIds)
    .in('team_id', teamIds);
  if (error) throw error;
  return (data ?? []) as VotingTeamAnswerRow[];
}

export async function castVote({
  rallyeId,
  questionId,
  votingTeamId,
  votedForTeamId,
}: {
  rallyeId: number;
  questionId: number;
  votingTeamId: TeamId;
  votedForTeamId: TeamId;
}): Promise<void> {
  const { error } = await supabase.rpc('cast_voting_vote', {
    rallye_id_param: rallyeId,
    question_id_param: questionId,
    voting_team_id_param: votingTeamId,
    voted_for_team_id_param: votedForTeamId,
  });
  if (error) throw error;
}
