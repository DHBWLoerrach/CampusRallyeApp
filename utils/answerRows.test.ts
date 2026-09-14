import {
  getAnswerKeyForQuestion,
  getAnswerText,
  isAnswerMarkedCorrect,
  isSameQuestionId,
} from './answerRows';
import type { AnswerRow } from '@/types/rallye';

describe('answerRows helpers', () => {
  it('reads answer text from solution option rows', () => {
    expect(
      getAnswerText({
        text: 'Mensa',
      } as Partial<AnswerRow>)
    ).toBe('Mensa');
    expect(getAnswerText({ text: null } as Partial<AnswerRow>)).toBe('');
    expect(getAnswerText(null)).toBe('');
    expect(getAnswerText(undefined)).toBe('');
  });

  it('only accepts the boolean correct flag', () => {
    expect(isAnswerMarkedCorrect({ correct: true } as Partial<AnswerRow>)).toBe(
      true
    );
    expect(
      isAnswerMarkedCorrect({ correct: false } as Partial<AnswerRow>)
    ).toBe(false);
    expect(isAnswerMarkedCorrect(undefined)).toBe(false);
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

  it('returns empty when candidates have no correct answer', () => {
    const answers = [
      {
        id: 1,
        question_id: 10,
        text: 'Belchenstrasse',
        correct: false,
      },
      {
        id: 2,
        question_id: 10,
        text: 'Mensa',
        correct: false,
      },
      {
        id: 3,
        question_id: 99,
        text: 'Other',
        correct: true,
      },
    ] as AnswerRow[];

    expect(getAnswerKeyForQuestion(answers, 10)).toBe('');
  });

  it('does not treat a single incorrect candidate as correct', () => {
    const answers = [
      {
        id: 1,
        question_id: 10,
        text: 'Belchenstrasse',
        correct: false,
      },
    ] as AnswerRow[];

    expect(getAnswerKeyForQuestion(answers, 10)).toBe('');
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
        correct: true,
      },
    ] as AnswerRow[];

    expect(getAnswerKeyForQuestion(answers, 10)).toBe('right');
  });
});
