export type TeamCreationErrorCode =
  | 'TEAM_NAME_INVALID'
  | 'TEAM_NAME_TAKEN'
  | 'TEAM_CREATE_NETWORK_ERROR'
  | 'TEAM_CREATE_UNKNOWN_ERROR'
  | 'TEAM_AUTO_RETRY_EXHAUSTED';

export class TeamCreationError extends Error {
  public readonly code: TeamCreationErrorCode;

  constructor(code: TeamCreationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'TeamCreationError';
    this.code = code;
  }
}
