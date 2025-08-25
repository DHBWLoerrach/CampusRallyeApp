export type QuestionType =
  | 'knowledge'
  | 'upload'
  | 'qr_code'
  | 'multiple_choice'
  | 'picture';

export interface Question {
  id: number;
  question: string;
  question_type: QuestionType;
  points: number;
  hint?: string | null;
  bucket_path?: string | null;
}

export interface AnswerRow {
  id: number;
  question_id: number;
  text?: string | null;
  correct?: boolean | null;
}

export interface QuestionProps {
  question: Question;
  onAnswer?: (correct: boolean, points: number) => void;
}

