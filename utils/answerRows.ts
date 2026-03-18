import type { AnswerRow } from '@/types/rallye';

function isTruthyFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 't';
}

export function getAnswerText(
  answer: Partial<AnswerRow> | null | undefined
): string {
  if (!answer) return '';
  const candidates = [answer.text, answer.answer, answer.content];
  const nonEmpty = candidates.find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0
  );
  if (nonEmpty) return nonEmpty;

  return candidates.find((value): value is string => typeof value === 'string') ?? '';
}

export function isSameQuestionId(
  leftQuestionId: unknown,
  rightQuestionId: unknown
): boolean {
  const left = Number(leftQuestionId);
  const right = Number(rightQuestionId);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return left === right;
}

export function isAnswerMarkedCorrect(
  answer: Partial<AnswerRow> | null | undefined
): boolean {
  if (!answer) return false;
  return isTruthyFlag(answer.correct) || isTruthyFlag(answer.is_correct);
}

export function getAnswerKeyForQuestion(
  answers: AnswerRow[],
  questionId: number
): string {
  const candidates = answers.filter((answer) =>
    isSameQuestionId(answer.question_id, questionId)
  );
  if (candidates.length === 0) return '';

  const explicitCorrect = candidates.find((answer) =>
    isAnswerMarkedCorrect(answer)
  );
  if (explicitCorrect) {
    return getAnswerText(explicitCorrect).toLowerCase().trim();
  }

  // Only fallback when there is exactly one non-empty candidate.
  const fallbackCandidates = candidates.filter(
    (answer) => getAnswerText(answer).trim().length > 0
  );
  if (fallbackCandidates.length !== 1) return '';

  return getAnswerText(fallbackCandidates[0]).toLowerCase().trim();
}
