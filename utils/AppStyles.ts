import { makeStyles } from './makeStyles';
import Constants from './Constants';

export const useAppStyles = makeStyles((p) => ({
  // Generic screens and sections
  screen: {
    flex: 1,
    backgroundColor: p.background,
  },
  section: {
    backgroundColor: p.card,
    borderRadius: Constants.cornerRadius,
  },
  card: {
    backgroundColor: p.card,
    borderRadius: Constants.cornerRadius,
  },
  infoBox: {
    backgroundColor: p.card,
    borderRadius: Constants.cornerRadius,
    padding: 16,
  },
  listRow: {
    backgroundColor: p.card,
    borderBottomWidth: 1,
    borderBottomColor: p.cellBorder,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: p.cellBorder,
  },
  // Text helpers
  text: {
    color: p.text,
  },
  muted: {
    color: p.textMuted,
  },
  title: {
    color: p.text,
    fontWeight: '600',
  },
}));
