import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';

const AUTOSAVE_INTERVAL = 15000;
const STORAGE_KEY = 'intervu_execution_autosave';

export function useAutosave(testId: string) {
  const {
    answers,
    currentQuestionIndex,
    remainingTime,
    hasUnsavedChanges,
    connectionStatus,
    setAutosaveStatus,
    setUnsavedChanges,
  } = useExecutionStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = async () => {
    if (connectionStatus !== 'ONLINE') {
      setAutosaveStatus('FAILED');
      return;
    }

    setAutosaveStatus('SAVING');

    try {
      // 1. Save to LocalStorage as a fallback
      const stateToSave = {
        answers,
        currentQuestionIndex,
        remainingTime,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}_${testId}`, JSON.stringify(stateToSave));

      // 2. Mock API call (In a real app, call execution.service.ts here)
      await new Promise((resolve) => setTimeout(resolve, 500));

      setAutosaveStatus('SAVED');
      setUnsavedChanges(false);
    } catch {
      setAutosaveStatus('FAILED');
    }
  };

  // Trigger save when hasUnsavedChanges becomes true
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Debounce saving
      timeoutRef.current = setTimeout(() => {
        performSave();
      }, 1000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasUnsavedChanges, answers, currentQuestionIndex]);

  // Periodic autosave every 15 seconds regardless of strict changes (for timer sync)
  useEffect(() => {
    const interval = setInterval(() => {
      performSave();
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [answers, currentQuestionIndex, remainingTime, connectionStatus]);
}
