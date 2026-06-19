import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import RallyePasswordSheet from '@/components/ui/RallyePasswordSheet';
import {
  clearRallyePasswordSheetSession,
  getRallyePasswordSheetSession,
} from '@/services/rallyePasswordSheetSession';
import type { RallyeRow } from '@/services/storage/rallyeStorage';

export default function RallyePasswordSheetRoute() {
  const router = useRouter();
  const session = useMemo(() => getRallyePasswordSheetSession(), []);
  const [joining, setJoining] = useState(false);
  const joiningRef = useRef(false);

  useEffect(() => {
    if (!session) {
      if (router.canGoBack()) router.back();
      return;
    }

    return () => {
      clearRallyePasswordSheetSession();
    };
  }, [router, session]);

  useEffect(() => {
    if (!joining) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );

    return () => subscription.remove();
  }, [joining]);

  const handleClose = () => {
    if (joiningRef.current) return;
    if (router.canGoBack()) router.back();
  };

  const handleJoin = async (rallye: RallyeRow) => {
    if (!session || joiningRef.current) return false;

    joiningRef.current = true;
    setJoining(true);
    try {
      const ok = await session.onJoin(rallye);
      if (!ok) {
        joiningRef.current = false;
        setJoining(false);
      }
      return ok;
    } catch (error) {
      joiningRef.current = false;
      setJoining(false);
      throw error;
    }
  };

  if (!session) return null;

  return (
    <RallyePasswordSheet
      rallye={session.rallye}
      joining={joining}
      onClose={handleClose}
      onJoin={handleJoin}
    />
  );
}
