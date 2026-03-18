import {
  getAnswerKeyForQuestion,
  getAnswerText,
  isAnswerMarkedCorrect,
  isSameQuestionId,
} from './answerRows';
import type { AnswerRow } from '@/types/rallye';

describe('answerRows helpers', () => {
  it('reads answer text from fallback fields', () => {
    expect(
      getAnswerText({
        text: 'Mensa',
      } as Partial<AnswerRow>)
    ).toBe('Mensa');
    expect(
      getAnswerText({
        answer: 'Belchenstrasse',
      } as Partial<AnswerRow>)
    ).toBe('Belchenstrasse');
    expect(
      getAnswerText({
        content: 'Mensa',
      } as Partial<AnswerRow>)
    ).toBe('Mensa');
    expect(
      getAnswerText({
        text: '',
        answer: 'Belchenstrasse',
      } as Partial<AnswerRow>)
    ).toBe('Belchenstrasse');
    expect(
      getAnswerText({
        text: '   ',
        content: 'Mensa',
      } as Partial<AnswerRow>)
    ).toBe('Mensa');
    expect(getAnswerText(null)).toBe('');
    expect(getAnswerText(undefined)).toBe('');
  });

  it('accepts multiple correct flag formats', () => {
    expect(
      isAnswerMarkedCorrect({ correct: true } as Partial<AnswerRow>)
    ).toBe(true);
    expect(
      isAnswerMarkedCorrect({ is_correct: 'true' } as Partial<AnswerRow>)
    ).toBe(true);
    expect(
      isAnswerMarkedCorrect({ correct: 1 } as Partial<AnswerRow>)
    ).toBe(true);
    expect(
      isAnswerMarkedCorrect({ correct: 't' } as Partial<AnswerRow>)
    ).toBe(true);
    expect(
      isAnswerMarkedCorrect({ correct: false } as Partial<AnswerRow>)
    ).toBe(false);
  });

  it('matches numeric and string question IDs', () => {
    expect(isSameQuestionId(10, '10')).toBe(true);
    expect(isSameQuestionId('42', 42)).toBe(true);
    expect(isSameQuestionId('foo', 42)).toBe(false);
    expect(isSameQuestionId(undefined, 1)).toBe(false);
  });

  it('returns empty for empty arrays or no matching question id', () => {
    expect(getAnswerKeyForQuestion([], 10)).toBe('');
    expect(
      getAnswerKeyForQuestion(
        [
          {
            id: 1,
            question_id: 11,
            text: 'Belchenstrasse',
            correct: true,
          },
        ] as AnswerRow[],
        10
      )
    ).toBe('');
  });

  it('returns empty when multiple candidates have no explicit correct answer', () => {
    const answers = [
      {
        id: 1,
        question_id: 10,
        answer: 'Belchenstrasse',
      },
      {
        id: 2,
        question_id: 10,
        answer: 'Mensa',
      },
      {
        id: 3,
        question_id: 99,
        answer: 'Other',
        correct: true,
      },
    ] as AnswerRow[];

    expect(getAnswerKeyForQuestion(answers, 10)).toBe('');
  });

  it('falls back to the only candidate when no explicit correct answer exists', () => {
    const answers = [
      {
        id: 1,
        question_id: 10,
        answer: 'Belchenstrasse',
      },
      {
        id: 2,
        question_id: 99,
        answer: 'Other',
      },
    ] as AnswerRow[];

    expect(getAnswerKeyForQuestion(answers, 10)).toBe('belchenstrasse');
  });

  it('prefers explicitly marked correct answer', () => {
    const answers = [
      {
        id: 1,
        question_id: 10,
        text: 'Wrong',
        correct: false,
      },
      {
        id: 2,
        question_id: 10,
        text: 'Right',
        is_correct: 'true',
      },
    ] as AnswerRow[];

    expect(getAnswerKeyForQuestion(answers, 10)).toBe('right');
  });
});
