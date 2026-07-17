import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';

export function useTestTimer() {
  const { remainingTime, setTimer, hasAttemptedResume, sectionTimingEnabled, sectionRemainingTime, setSectionTimer } = useExecutionStore();

  useEffect(() => {
    // If section timing is enabled, useSectionTimer handles the tick logic separately.
    // For the global timer, we still decrement it in the background if we want, or we can just pause it.
    // Let's keep decrementing the global timer so total time is tracked, but display the section timer.
    if (remainingTime <= 0 || !hasAttemptedResume) return;

    const intervalId = setInterval(() => {
      setTimer(remainingTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingTime, setTimer, hasAttemptedResume]);

  const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayTime = sectionTimingEnabled ? sectionRemainingTime : remainingTime;
  const isWarning = displayTime > 0 && displayTime <= (sectionTimingEnabled ? 60 : 600);

  return {
    remainingTime: displayTime,
    formattedTime: formatTime(displayTime),
    isWarning,
    isSectionTimer: sectionTimingEnabled,
  };
}
