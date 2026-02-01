export type QuestionType =
  | 'knowledge'
  | 'upload'
  | 'qr_code'
  | 'multiple_choice'
  | 'picture';

// Session type describes HOW a user participates in a rallye
// - 'exploration': Self-guided tour without timer or team (campus exploration)
// - 'competition': Team-based rallye with timer and scoring
export type SessionType = 'exploration' | 'competition';

// Legacy alias for backwards compatibility during migration
/** @deprecated Use SessionType instead */
export type RallyeMode = 'tour' | 'department';

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

// Raw rallye data as stored in the database (no mode field)
export interface RallyeData {
  id: number;
  name: string;
  status: RallyeStatus;
  password: string | null;
  end_time: string | null;
  created_at?: string;
}

// Active session: combines rallye data with participation type
export interface RallyeSession {
  rallye: RallyeData;
  sessionType: SessionType;
}

// Legacy Rallye type with mode - used during migration
/** @deprecated Use RallyeSession instead */
export interface Rallye {
  id: number;
  name: string;
  status: RallyeStatus;
  password: string;
  mode: RallyeMode;
  end_time: string | null;
  created_at: string;
}

// Helper to convert legacy mode to session type
export function modeToSessionType(mode: RallyeMode): SessionType {
  return mode === 'tour' ? 'exploration' : 'competition';
}

// Helper to convert session type to legacy mode
export function sessionTypeToMode(sessionType: SessionType): RallyeMode {
  return sessionType === 'exploration' ? 'tour' : 'department';
}

export interface Team {
  id: number;
  name: string;
  rallye_id?: number;
  points?: number;
  time_played?: string | null;
}
