import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';

export function useTestTimer() {
  const {
    remainingTime,
    setTimer,
    hasAttemptedResume,
    sectionTimingEnabled,
    sectionRemainingTime,
    testInstance,
    loading,
    serverClockOffsetMs,
  } = useExecutionStore();

  const anchorRef = useRef<{ localStart: number; initialSeconds: number } | null>(null);

  // Sync fallback anchor if remainingTime was restored or updated externally
  useEffect(() => {
    if (typeof remainingTime === 'number' && !isNaN(remainingTime)) {
      if (!anchorRef.current) {
        anchorRef.current = { localStart: Date.now(), initialSeconds: remainingTime };
      } else {
        const expected = Math.max(0, anchorRef.current.initialSeconds - Math.floor((Date.now() - anchorRef.current.localStart) / 1000));
        // If store value drifted significantly from local anchor (e.g. from resume or server sync), re-anchor
        if (Math.abs(expected - remainingTime) > 2) {
          anchorRef.current = { localStart: Date.now(), initialSeconds: remainingTime };
        }
      }
    }
  }, [remainingTime]);

  useEffect(() => {
    if (loading || !testInstance || !hasAttemptedResume) return;

    if (!testInstance.expiresAt && !anchorRef.current) {
      anchorRef.current = {
        localStart: Date.now(),
        initialSeconds: typeof remainingTime === 'number' && !isNaN(remainingTime) ? remainingTime : (testInstance.durationSeconds ?? 0),
      };
    }

    const updateTimer = () => {
      const state = useExecutionStore.getState ? useExecutionStore.getState() : undefined;
      const inst = state?.testInstance || testInstance;
      const offset = state?.serverClockOffsetMs ?? serverClockOffsetMs ?? 0;

      // Authoritative calculation via server expiresAt
      if (inst?.expiresAt) {
        const expiry = new Date(inst.expiresAt).getTime();
        if (!isNaN(expiry)) {
          const serverNow = Date.now() - offset;
          const diff = Math.max(0, Math.floor((expiry - serverNow) / 1000));
          setTimer(diff);
          return;
        }
      }

      // Wall-clock calculation via local anchor
      if (anchorRef.current) {
        const elapsed = Math.floor((Date.now() - anchorRef.current.localStart) / 1000);
        const diff = Math.max(0, anchorRef.current.initialSeconds - elapsed);
        setTimer(diff);
        return;
      }

      const curr = state?.remainingTime ?? remainingTime;
      if (typeof curr === 'number' && !isNaN(curr)) {
        setTimer(Math.max(0, curr - 1));
      }
    };

    const intervalId = setInterval(updateTimer, 1000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        updateTimer();
      }
    };
    const handleFocus = () => {
      updateTimer();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [testInstance?.id, testInstance?.expiresAt, hasAttemptedResume, loading, setTimer, serverClockOffsetMs]);

  const formatTime = (seconds: number | undefined | null) => {
    const validSeconds = typeof seconds === 'number' && !isNaN(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const h = Math.floor(validSeconds / 3600);
    const m = Math.floor((validSeconds % 3600) / 60);
    const s = validSeconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const rawDisplayTime = sectionTimingEnabled ? sectionRemainingTime : remainingTime;
  const displayTime = typeof rawDisplayTime === 'number' && !isNaN(rawDisplayTime) ? Math.max(0, rawDisplayTime) : 0;
  const isWarning = displayTime > 0 && displayTime <= (sectionTimingEnabled ? 60 : 600);

  return {
    remainingTime: displayTime,
    formattedTime: formatTime(displayTime),
    isWarning,
    isSectionTimer: !!sectionTimingEnabled,
    isReady: !loading && !!testInstance,
  };
}
