import type { Question } from '@/types/rallye';

const shuffleInPlace = <T,>(items: T[]): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const isUploadQuestion = (question: Question) =>
  question.question_type === 'upload';

const orderGroupWithPreviousOrder = (
  questions: Question[],
  previousIds: number[]
): Question[] => {
  if (questions.length <= 1 || previousIds.length === 0) {
    return [...questions];
  }

  const previousIndexById = new Map(
    previousIds.map((id, index) => [id, index] as const)
  );
  const known = questions
    .filter((question) => previousIndexById.has(question.id))
    .sort(
      (left, right) =>
        (previousIndexById.get(left.id) ?? 0) -
        (previousIndexById.get(right.id) ?? 0)
    );
  const unknown = questions.filter(
    (question) => !previousIndexById.has(question.id)
  );

  return [...known, ...unknown];
};

export function orderQuestionsWithUploadsLast(questions: Question[]): Question[] {
  const uploads: Question[] = [];
  const others: Question[] = [];

  for (const question of questions) {
    if (isUploadQuestion(question)) {
      uploads.push(question);
    } else {
      others.push(question);
    }
  }

  return [
    ...shuffleInPlace([...others]),
    ...shuffleInPlace([...uploads]),
  ];
}

export function orderQuestionsForSession(
  questions: Question[],
  previousQuestions: Question[] = []
): Question[] {
  if (previousQuestions.length === 0) {
    return orderQuestionsWithUploadsLast(questions);
  }

  const previousOtherIds = previousQuestions
    .filter((question) => !isUploadQuestion(question))
    .map((question) => question.id);
  const previousUploadIds = previousQuestions
    .filter(isUploadQuestion)
    .map((question) => question.id);

  const uploads: Question[] = [];
  const others: Question[] = [];

  for (const question of questions) {
    if (isUploadQuestion(question)) {
      uploads.push(question);
    } else {
      others.push(question);
    }
  }

  return [
    ...orderGroupWithPreviousOrder(others, previousOtherIds),
    ...orderGroupWithPreviousOrder(uploads, previousUploadIds),
  ];
}
