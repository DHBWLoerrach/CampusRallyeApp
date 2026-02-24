import type { Question } from '@/types/rallye';
import { orderQuestionsWithUploadsLast } from './orderQuestions';

const makeQuestion = (
  id: number,
  type: Question['question_type']
): Question => ({
  id,
  question: `Question ${id}`,
  question_type: type,
  points: 1,
});

describe('orderQuestionsWithUploadsLast', () => {
  it('keeps upload questions at the end while shuffling each group', () => {
    const questions = [
      makeQuestion(1, 'knowledge'),
      makeQuestion(2, 'upload'),
      makeQuestion(3, 'qr_code'),
      makeQuestion(4, 'upload'),
      makeQuestion(5, 'multiple_choice'),
    ];

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const ordered = orderQuestionsWithUploadsLast(questions);

    expect(randomSpy).toHaveBeenCalledTimes(3);
    randomSpy.mockRestore();

    const uploadStart = ordered.length - 2;
    expect(
      ordered.slice(uploadStart).every((q) => q.question_type === 'upload')
    ).toBe(true);
    expect(
      ordered.slice(0, uploadStart).every((q) => q.question_type !== 'upload')
    ).toBe(true);
    expect(
      ordered
        .map((q) => q.id)
        .sort((a, b) => a - b)
    ).toEqual(
      questions
        .map((q) => q.id)
        .sort((a, b) => a - b)
    );
  });

  it('returns empty array for empty input', () => {
    expect(orderQuestionsWithUploadsLast([])).toEqual([]);
  });

  it('handles all-upload input (all shuffled, no others group)', () => {
    const questions = [
      makeQuestion(1, 'upload'),
      makeQuestion(2, 'upload'),
    ];
    const ordered = orderQuestionsWithUploadsLast(questions);
    expect(ordered).toHaveLength(2);
    expect(ordered.every((q) => q.question_type === 'upload')).toBe(true);
  });

  it('handles no-upload input (all in others group)', () => {
    const questions = [
      makeQuestion(1, 'knowledge'),
      makeQuestion(2, 'geocaching'),
      makeQuestion(3, 'qr_code'),
    ];
    const ordered = orderQuestionsWithUploadsLast(questions);
    expect(ordered).toHaveLength(3);
    expect(ordered.every((q) => q.question_type !== 'upload')).toBe(true);
  });

  it('returns single question as-is', () => {
    const questions = [makeQuestion(1, 'knowledge')];
    const ordered = orderQuestionsWithUploadsLast(questions);
    expect(ordered).toEqual(questions);
  });

  it('includes geocaching in the non-upload group', () => {
    const questions = [
      makeQuestion(1, 'geocaching'),
      makeQuestion(2, 'upload'),
    ];
    const ordered = orderQuestionsWithUploadsLast(questions);
    expect(ordered[0].question_type).toBe('geocaching');
    expect(ordered[1].question_type).toBe('upload');
  });
});
