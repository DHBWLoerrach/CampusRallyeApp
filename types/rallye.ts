export type QuestionType =
  | 'knowledge'
  | 'upload'
  | 'qr_code'
  | 'multiple_choice'
  | 'picture';

export const RALLYE_STATUSES = [
  'preparing',
  'inactive',
  'running',
  'voting',
  'ranking',
  'ended',
] as const;

export type RallyeStatus = (typeof RALLYE_STATUSES)[number];

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
  status: RallyeStatus;
  password: string;
  tour_mode: boolean; // Deprecated: wird durch Organization.default_rallye_id ersetzt
  end_time: string | null;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  rallye_id?: number;
  points?: number;
  time_played?: string | null;
}
