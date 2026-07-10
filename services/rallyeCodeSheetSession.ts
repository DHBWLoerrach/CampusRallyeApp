import type { RallyeRow } from '@/services/storage/rallyeStorage';

type RallyeCodeSheetSession = {
  rallye: RallyeRow;
  onJoin: (rallye: RallyeRow) => Promise<boolean>;
};

let currentSession: RallyeCodeSheetSession | null = null;

export function setRallyeCodeSheetSession(session: RallyeCodeSheetSession) {
  currentSession = session;
}

export function getRallyeCodeSheetSession() {
  return currentSession;
}

export function clearRallyeCodeSheetSession() {
  currentSession = null;
}
