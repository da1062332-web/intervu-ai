import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';

const AUTOSAVE_INTERVAL = 15000;
const STORAGE_KEY = 'intervu_execution_autosave';

// FE-001: Max consecutive local storage failures before giving up on localStorage
const MAX_LOCAL_STORAGE_FAILURES = 3;

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
  // FE-001: Track consecutive localStorage failures to break the retry loop
  const localStorageFailureCountRef = useRef(0);
  const localStorageDisabledRef = useRef(false);

  const performSave = async () => {
    // FE-001: If localStorage is permanently unavailable, skip silently
    if (localStorageDisabledRef.current) {
      // Still clear unsaved changes since network autosave (useAnswerPersistence) handles this
      setUnsavedChanges(false);
      return;
    }

    try {
      const stateToSave = {
        answers,
        currentQuestionIndex,
        remainingTime,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}_${testId}`, JSON.stringify(stateToSave));

      // Reset failure counter on success
      localStorageFailureCountRef.current = 0;

      // If we are online, the persistence layer handles the network sync.
      setUnsavedChanges(false);
    } catch (error: any) {
      // FE-001: Count failures and disable localStorage after too many failures
      localStorageFailureCountRef.current += 1;

      if (
        error?.name === 'QuotaExceededError' ||
        localStorageFailureCountRef.current >= MAX_LOCAL_STORAGE_FAILURES
      ) {
        // FE-001: Permanently disable localStorage autosave to break the retry loop
        localStorageDisabledRef.current = true;
        console.warn(
          '[Autosave] FE-001: localStorage unavailable or full. Offline snapshot disabled. ' +
            'Network autosave (useAnswerPersistence) remains active.',
          error,
        );
        // FE-001: Still clear the unsaved flag so we don't loop infinitely
        // The backend autosave (useAnswerPersistence) is the source of truth
        setUnsavedChanges(false);
      } else {
        console.warn(
          `[Autosave] FE-001: localStorage save failed (attempt ${localStorageFailureCountRef.current}/${MAX_LOCAL_STORAGE_FAILURES})`,
          error,
        );
        // FE-001: On transient failure, still clear unsaved changes to break the loop
        // The network autosave handles data safety; local snapshot is only a convenience
        setUnsavedChanges(false);
      }
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
