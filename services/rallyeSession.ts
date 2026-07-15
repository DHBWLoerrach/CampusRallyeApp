import { store$ } from '@/services/storage/Store';
import {
  setCurrentRallye,
  type RallyeRow,
} from '@/services/storage/rallyeStorage';
import {
  clearCurrentTeam,
  getCurrentTeam,
  teamExists,
} from '@/services/storage/teamStorage';
import { Logger } from '@/utils/Logger';

/** Starts a rallye session and rehydrates a previously stored team for it, if any. */
export async function joinRallye(rallye: RallyeRow): Promise<void> {
  store$.team.set(null);
  store$.reset();
  store$.rallye.set(rallye);
  await setCurrentRallye(rallye);

  try {
    const existingTeam = await getCurrentTeam(rallye.id);
    if (existingTeam) {
      const exists = await teamExists(rallye.id, existingTeam.id);
      if (exists === 'missing') {
        // Only a definitive "missing" clears the team; "unknown" (e.g. offline)
        // keeps it so a network blip never drops a team assignment.
        await clearCurrentTeam(rallye.id);
        store$.team.set(null);
      } else {
        store$.team.set(existingTeam);
      }
    }
  } catch (rehydrateError) {
    Logger.error(
      'RallyeSession',
      'Error rehydrating team after join',
      rehydrateError
    );
    store$.team.set(null);
  }

  store$.enabled.set(true);
}

/** Starts a tour-mode session without a team. */
export async function startTourMode(rallye: RallyeRow): Promise<void> {
  store$.team.set(null);
  store$.reset();
  store$.rallye.set(rallye);
  await setCurrentRallye(rallye);
  store$.enabled.set(true);
}
