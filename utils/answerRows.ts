import type { AnswerRow } from '@/types/rallye';

export function getAnswerText(
  answer: Partial<AnswerRow> | null | undefined
): string {
  return answer?.text ?? '';
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
  return answer?.correct === true;
}

export function getAnswerKeyForQuestion(
  answers: AnswerRow[],
  questionId: number
): string {
  return getCorrectAnswerTextForQuestion(answers, questionId).toLowerCase();
}

export function getCorrectAnswerTextForQuestion(
  answers: AnswerRow[],
  questionId: number
): string {
  const candidates = answers.filter((answer) =>
    isSameQuestionId(answer.question_id, questionId)
  );
  if (candidates.length === 0) return '';

  const correctAnswer = candidates.find((answer) =>
    isAnswerMarkedCorrect(answer)
  );
  if (!correctAnswer) return '';

  return getAnswerText(correctAnswer).trim();
}
