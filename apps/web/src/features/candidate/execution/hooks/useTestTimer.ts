import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';

export function useTestTimer() {
  const { remainingTime, setTimer } = useExecutionStore();

  useEffect(() => {
    if (remainingTime <= 0) return;

    const intervalId = setInterval(() => {
      setTimer(remainingTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingTime, setTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = remainingTime > 0 && remainingTime <= 600;

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
    isWarning,
  };
}
