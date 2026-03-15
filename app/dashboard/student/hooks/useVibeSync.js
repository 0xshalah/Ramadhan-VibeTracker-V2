import { useState, useEffect } from 'react';
import { updateUserProgress, getLocalTodayId } from '@/lib/firebase';

export const useVibeSync = ({
  user,
  tilawah,
  targetTilawah,
  sholat,
  sunnah,
  verifiedSadaqah,
  loadingContext,
  isInitialLoad
}) => {
  const [syncStatus, setSyncStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [xpBurstTrigger, setXpBurstTrigger] = useState(0);

  // DB SYNC ENGINE (TWO-WAY BINDING)
  useEffect(() => {
    if (user && isInitialLoad && !isInitialLoad.current && !loadingContext) {
      setSyncStatus('saving');
      const todayId = getLocalTodayId();
      
      // Materialize Vibe Points to Payload
      const sunnahDoneCount = (sunnah.tarawih ? 1 : 0) + (sunnah.sahur ? 1 : 0) + (verifiedSadaqah ? 1 : 0);
      const sunnahBonusXP = sunnahDoneCount * 5;
      
      const payload = { tilawah, targetTilawah, sholat, sunnah, earnedXP: sunnahBonusXP };
      
      // Debounce saving
       const timer = setTimeout(async () => {
        try {
          await updateUserProgress(user.uid, todayId, payload);
          setSyncStatus('saved');
          setXpBurstTrigger(prev => prev + 1);
        } catch(e) {
          setSyncStatus('error');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, tilawah, targetTilawah, sholat, sunnah, verifiedSadaqah, loadingContext, isInitialLoad]);

  // PREVENT ACCIDENTAL CLOSE WHEN SAVING
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (syncStatus === 'saving') {
        const payload = { tilawah, targetTilawah, sholat, sunnah };
        const todayId = getLocalTodayId();
        updateUserProgress(user?.uid, todayId, payload); // Force fire
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus, tilawah, targetTilawah, sholat, sunnah, user]);

  return { syncStatus, xpBurstTrigger };
};
