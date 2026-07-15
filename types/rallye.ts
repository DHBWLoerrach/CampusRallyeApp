export type QuestionType =
  | 'knowledge'
  | 'upload'
  | 'qr_code'
  | 'multiple_choice'
  | 'picture'
  | 'geocaching';

// UI mapping:
// - 'tour' => "Campus Tour" (self-guided, no team required)
// - 'department' => "Rallye" (team-based mode)
export type RallyeMode = 'tour' | 'department';

export const RALLYE_STATUSES = [
  'draft',
  'ready',
  'running',
  'voting',
  'results',
  'ended',
] as const;

export type RallyeStatus = (typeof RALLYE_STATUSES)[number];

export type GeocachingInputType = 'text' | 'qr';

export interface Question {
  id: number;
  question: string;
  question_type: QuestionType;
  point_value: number;
  hint?: string | null;
  bucket_path?: string | null;
  target_latitude?: number | null;
  target_longitude?: number | null;
  proximity_radius?: number | null;
  input_type?: GeocachingInputType | null;
}

export interface AnswerRow {
  id: number;
  question_id: number | string;
  text?: string | null;
  answer?: string | null;
  content?: string | null;
  // Supabase data can represent this flag as boolean, numeric, or textual truthy values.
  correct?: boolean | string | number | null;
  is_correct?: boolean | string | number | null;
}

export interface QuestionProps {
  question: Question;
}

export interface Location {
  id: number;
  name: string;
  default_rallye_id: number | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  location_id: number;
  created_at: string;
}

export interface RallyeDbRow {
  id: number;
  name: string;
  department_id: number | null;
  status: RallyeStatus;
  rallye_code: string | null;
  /** PostgreSQL `time without time zone`, serialized as `HH:mm:ss`. */
  rallye_end: string | null;
  created_at: string;
}

export type RallyeStorageRow = Pick<
  RallyeDbRow,
  'id' | 'name' | 'department_id' | 'status' | 'rallye_code' | 'rallye_end'
>;

export interface Rallye extends RallyeDbRow {
  mode: RallyeMode;
}

/** Primary key of a team (`teams.id`). Numeric — see `Team`. */
export type TeamId = number;

export interface Team {
  id: TeamId;
  name: string;
  rallye_id?: number;
  points?: number;
  play_time?: string | null;
}
