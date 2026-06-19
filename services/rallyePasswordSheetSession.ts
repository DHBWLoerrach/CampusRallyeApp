import type { RallyeRow } from '@/services/storage/rallyeStorage';

type RallyePasswordSheetSession = {
  rallye: RallyeRow;
  onJoin: (rallye: RallyeRow) => Promise<boolean>;
};

let currentSession: RallyePasswordSheetSession | null = null;

export function setRallyePasswordSheetSession(
  session: RallyePasswordSheetSession
) {
  currentSession = session;
}

export function getRallyePasswordSheetSession() {
  return currentSession;
}

export function clearRallyePasswordSheetSession() {
  currentSession = null;
}
