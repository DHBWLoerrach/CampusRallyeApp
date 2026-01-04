import { makeStyles } from './makeStyles';
import Constants from './Constants';

export const useAppStyles = makeStyles((p) => ({
  // Generic screens and sections
  screen: {
    flex: 1,
    backgroundColor: p.surface0,
  },
  infoBox: {
    backgroundColor: p.surface1,
    borderRadius: Constants.cornerRadius,
    padding: 16,
  },
  listRow: {
    backgroundColor: p.surface1,
    borderBottomWidth: 1,
    borderBottomColor: p.borderSubtle,
  },
  // Text helpers
  text: {
    color: p.text,
  },
  muted: {
    color: p.textMuted,
  },
}));
