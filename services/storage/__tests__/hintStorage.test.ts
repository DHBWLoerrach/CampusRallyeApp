import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HINT_COST,
  applyHintCost,
  hasUsedHint,
  markHintUsed,
} from '@/services/storage/hintStorage';

const scope = { rallyeId: 1, teamId: 2, questionId: 3 };

describe('hintStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('returns false for an unseen scope', async () => {
    await expect(hasUsedHint(scope)).resolves.toBe(false);
  });

  it('remembers a marked scope', async () => {
    await markHintUsed(scope);

    await expect(hasUsedHint(scope)).resolves.toBe(true);
  });

  it.each([
    [{ ...scope, rallyeId: 11 }],
    [{ ...scope, teamId: 12 }],
    [{ ...scope, questionId: 13 }],
  ])('does not collide with another scope %#', async (otherScope) => {
    await markHintUsed(scope);

    await expect(hasUsedHint(otherScope)).resolves.toBe(false);
  });

  it.each([null, [], { unexpected: true }, { '1:2:3': false }])(
    'does not treat malformed stored data as used: %p',
    async (stored) => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        stored === null ? null : JSON.stringify(stored)
      );

      await expect(hasUsedHint(scope)).resolves.toBe(false);
    }
  );

  it('propagates storage read failures', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('storage unavailable')
    );

    await expect(hasUsedHint(scope)).rejects.toThrow('storage unavailable');
    consoleSpy.mockRestore();
  });

  it.each([
    { ...scope, rallyeId: 0 },
    { ...scope, teamId: -1 },
    { ...scope, questionId: 1.5 },
    { ...scope, questionId: Number.POSITIVE_INFINITY },
  ])('rejects invalid IDs in scope %p', async (invalidScope) => {
    await expect(hasUsedHint(invalidScope)).rejects.toThrow();
    await expect(markHintUsed(invalidScope)).rejects.toThrow();
  });

  it('leaves points unchanged when no hint was used', () => {
    expect(applyHintCost(5, false)).toBe(5);
  });

  it('subtracts the shared hint cost and clamps at zero', () => {
    expect(HINT_COST).toBe(1);
    expect(applyHintCost(5, true)).toBe(4);
    expect(applyHintCost(1, true)).toBe(0);
    expect(applyHintCost(0, true)).toBe(0);
  });
});
