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
    // Save to LocalStorage as a fallback (Network sync handled by useAnswerPersistence)
    try {
      const stateToSave = {
        answers,
        currentQuestionIndex,
        remainingTime,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}_${testId}`, JSON.stringify(stateToSave));
      
      // If we are online and this isn't failing, we can assume the persistence layer is handling the network sync.
      // The status will be driven by the useAnswerPersistence mostly, but we can set to SAVED locally if needed.
      // However, we just clear the unsaved changes flag since the local snapshot is updated.
      setUnsavedChanges(false);
    } catch {
      // Local storage might fail on quota exceeded
      console.warn('Failed to save assessment to local storage fallback');
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
