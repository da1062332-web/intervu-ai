import { useEffect } from 'react';
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
  } = useExecutionStore();

  useEffect(() => {
    // If section timing is enabled, useSectionTimer handles the tick logic separately.
    // For the global timer, we still decrement it in the background if we want, or we can just pause it.
    // Let's keep decrementing the global timer so total time is tracked, but display the section timer.
    if (loading || !testInstance || remainingTime <= 0 || !hasAttemptedResume) return;

    const intervalId = setInterval(() => {
      setTimer(Math.max(0, remainingTime - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingTime, setTimer, hasAttemptedResume, loading, testInstance]);

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
