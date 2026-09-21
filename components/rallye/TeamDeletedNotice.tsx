import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { useLanguage } from '@/utils/LanguageContext';

/** Tells the user once that their team was deleted server-side (e.g. by a rallye reset). */
export default function TeamDeletedNotice() {
  const { t } = useLanguage();
  const teamDeleted = useSelector(() => store$.teamDeleted.get());

  useEffect(() => {
    if (!teamDeleted) return;
    store$.teamDeleted.set(false);
    Alert.alert(t('team.deleted.title'), t('team.deleted.message'));
  }, [teamDeleted, t]);

  return null;
}
