/**
 * Detects the foreign key violation Supabase returns when an answer references
 * a team that was deleted server-side (e.g. the rallye was reset). Such an
 * answer can never be stored, so retrying it is pointless.
 */
export function isMissingTeamError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return (
    code === '23503' &&
    typeof message === 'string' &&
    message.includes('team_answers_team_id_fkey')
  );
}
