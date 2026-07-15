import { supabase } from '@/utils/Supabase';
import type { TeamId } from '@/types/rallye';

export type ScoreboardTeamRow = {
  id: TeamId;
  name: string;
  created_at: string;
  play_time: string | null;
};

export type ScoreboardPointsRow = {
  team_id: ScoreboardTeamRow['id'];
  team_points: number;
};

export async function getScoreboardData(rallyeId: number): Promise<{
  teams: ScoreboardTeamRow[];
  points: ScoreboardPointsRow[];
}> {
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, created_at, play_time')
    .eq('rallye_id', rallyeId);
  if (teamsError) throw teamsError;

  const teamRows = (teams ?? []) as ScoreboardTeamRow[];
  const teamIds = teamRows.map((team) => team.id);
  if (teamIds.length === 0) return { teams: teamRows, points: [] };

  const { data: points, error: pointsError } = await supabase
    .from('team_answers')
    .select('team_id, team_points')
    .in('team_id', teamIds);
  if (pointsError) throw pointsError;

  return { teams: teamRows, points: (points ?? []) as ScoreboardPointsRow[] };
}
