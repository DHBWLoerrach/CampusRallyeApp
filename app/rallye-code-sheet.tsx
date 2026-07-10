import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import RallyeCodeSheet from '@/components/ui/RallyeCodeSheet';
import {
  clearRallyeCodeSheetSession,
  getRallyeCodeSheetSession,
} from '@/services/rallyeCodeSheetSession';
import type { RallyeRow } from '@/services/storage/rallyeStorage';

export default function RallyeCodeSheetRoute() {
  const router = useRouter();
  const session = useMemo(() => getRallyeCodeSheetSession(), []);
  const [joining, setJoining] = useState(false);
  const joiningRef = useRef(false);

  useEffect(() => {
    if (!session) {
      if (router.canGoBack()) router.back();
      return;
    }

    return () => {
      clearRallyeCodeSheetSession();
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
    <RallyeCodeSheet
      rallye={session.rallye}
      joining={joining}
      onClose={handleClose}
      onJoin={handleJoin}
    />
  );
}
