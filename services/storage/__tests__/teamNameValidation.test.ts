import {
  normalizeTeamName,
  validateTeamName,
} from '../teamNameValidation';

describe('teamNameValidation', () => {
  it('normalizes outer and inner whitespace', () => {
    expect(normalizeTeamName('  Team   Alpha  ')).toBe('Team Alpha');
  });

  it('rejects empty names', () => {
    expect(validateTeamName('   ')).toEqual({ valid: false, reason: 'empty' });
  });

  it('rejects names shorter than 5 chars', () => {
    expect(validateTeamName('Abc')).toEqual({ valid: false, reason: 'length' });
  });

  it('rejects names longer than 20 chars', () => {
    expect(validateTeamName('ABCDEFGHIJKLMNOPQRSTU')).toEqual({
      valid: false,
      reason: 'length',
    });
  });

  it('rejects non-ascii characters', () => {
    expect(validateTeamName('Team Muenchenä')).toEqual({
      valid: false,
      reason: 'invalid_chars',
    });
  });

  it('accepts valid ascii names', () => {
    expect(validateTeamName('Team_Alpha-1')).toEqual({ valid: true });
  });
});
