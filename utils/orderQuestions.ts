import type { Question } from '@/types/rallye';

const shuffleInPlace = <T,>(items: T[]): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

export function orderQuestionsWithUploadsLast(questions: Question[]): Question[] {
  const uploads: Question[] = [];
  const others: Question[] = [];

  for (const question of questions) {
    if (question.question_type === 'upload') {
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
