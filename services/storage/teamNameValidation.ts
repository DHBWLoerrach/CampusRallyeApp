export type TeamNameValidationReason =
  | 'empty'
  | 'length'
  | 'invalid_chars';

export type TeamNameValidationResult = {
  valid: boolean;
  reason?: TeamNameValidationReason;
};

export const TEAM_NAME_MIN_LENGTH = 5;
export const TEAM_NAME_MAX_LENGTH = 20;

const TEAM_NAME_REGEX = /^[A-Za-z0-9 _-]{5,20}$/;

export function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

export function validateTeamName(name: string): TeamNameValidationResult {
  const normalized = normalizeTeamName(name);

  if (!normalized) {
    return { valid: false, reason: 'empty' };
  }

  if (
    normalized.length < TEAM_NAME_MIN_LENGTH ||
    normalized.length > TEAM_NAME_MAX_LENGTH
  ) {
    return { valid: false, reason: 'length' };
  }

  if (!TEAM_NAME_REGEX.test(normalized)) {
    return { valid: false, reason: 'invalid_chars' };
  }

  return { valid: true };
}
