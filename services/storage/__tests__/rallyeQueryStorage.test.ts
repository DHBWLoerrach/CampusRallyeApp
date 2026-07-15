const mockFrom = jest.fn();

jest.mock('@/utils/Supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

jest.mock('@/utils/Logger', () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import { Logger } from '@/utils/Logger';

import {
  getAnsweredQuestionIds,
  getQuestionsWithGeocachingMetadata,
  getRallyeQuestionIds,
  getRefreshableRallyeFields,
  getSolutionOptions,
} from '../rallyeStorage';

type Result = { data: unknown; error: unknown };

function query(result: Result) {
  const value: any = {
    select: jest.fn(() => value),
    eq: jest.fn(() => value),
    in: jest.fn(() => value),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve: (result: Result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return value;
}

function useResults(results: Record<string, Result>) {
  mockFrom.mockImplementation((table: string) => query(results[table]));
}

describe('rallye query storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads rallye question ids, solution options, and answered ids', async () => {
    const answers = [{ id: 1, question_id: 4, text: 'x', correct: true }];
    useResults({
      rallye_questions: { data: [{ question_id: 4 }], error: null },
      solution_options: { data: answers, error: null },
      team_answers: { data: [{ question_id: 4 }], error: null },
    });

    await expect(getRallyeQuestionIds(2)).resolves.toEqual([4]);
    await expect(getSolutionOptions([4])).resolves.toEqual(answers);
    await expect(getAnsweredQuestionIds(3)).resolves.toEqual([4]);
  });

  it('throws errors from list queries', async () => {
    const error = new Error('failed');
    useResults({ rallye_questions: { data: null, error } });
    await expect(getRallyeQuestionIds(2)).rejects.toBe(error);
  });

  it('maps question fields and merges geocaching metadata', async () => {
    useResults({
      questions: {
        data: [
          { id: 4, content: 'Find me', type: 'geocaching', point_value: 5 },
        ],
        error: null,
      },
      geocaching_questions: {
        data: [
          {
            question_id: 4,
            target_latitude: 1,
            target_longitude: 2,
            proximity_radius: 10,
            input_type: 'qr',
          },
        ],
        error: null,
      },
    });

    await expect(getQuestionsWithGeocachingMetadata([4])).resolves.toEqual([
      expect.objectContaining({
        id: 4,
        question: 'Find me',
        question_type: 'geocaching',
        target_latitude: 1,
        input_type: 'qr',
      }),
    ]);
    expect(mockFrom).toHaveBeenCalledWith('geocaching_questions');
  });

  it('skips geocaching metadata for other question types', async () => {
    useResults({
      questions: {
        data: [{ id: 5, content: 'Question', type: 'skill', point_value: 2 }],
        error: null,
      },
    });
    await getQuestionsWithGeocachingMetadata([5]);
    expect(mockFrom).not.toHaveBeenCalledWith('geocaching_questions');
  });

  it('returns dynamic rallye fields and degrades to null on error', async () => {
    const fields = { status: 'running', rallye_end: null, name: 'R' };
    useResults({ rallyes: { data: fields, error: null } });
    await expect(getRefreshableRallyeFields(2)).resolves.toEqual(fields);

    const error = new Error('status failed');
    useResults({ rallyes: { data: null, error } });
    await expect(getRefreshableRallyeFields(2)).resolves.toBeNull();
    expect(Logger.error).toHaveBeenCalledWith(
      'RallyeStorage',
      'Error fetching dynamic rallye fields',
      error
    );
  });
});
