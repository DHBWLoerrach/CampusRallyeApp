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

export interface Organization {
  id: number;
  name: string;
  default_rallye_id: number | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  organization_id: number;
  created_at: string;
}

export interface Rallye {
  id: number;
  name: string;
  status: string;
  password: string;
  tour_mode: boolean; // Deprecated: wird durch Organization.default_rallye_id ersetzt
  end_time: string | null;
  created_at: string;
}

