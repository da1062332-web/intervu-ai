import { useEffect, useState } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { useTestSessionStore } from '@/modules/session/stores/test-session.store';

const STORAGE_KEY = 'intervu_execution_autosave';

export function useSessionRecovery(testId: string) {
  const { restoreStateFromStorage, testInstance } = useExecutionStore();
  const { sessionId, status } = useTestSessionStore();
  const [isRecovering, setIsRecovering] = useState(true);

  useEffect(() => {
    // Only attempt recovery if we have initialized the test instance
    if (!testInstance || testInstance.id !== testId) {
      return;
    }

    try {
      // If we have an active session in sessionStorage, we should recover answers
      if (sessionId && (status === 'ACTIVE' || status === 'PAUSED')) {
        const savedData = localStorage.getItem(`${STORAGE_KEY}_${testId}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          restoreStateFromStorage({
            answers: parsed.answers || {},
            currentQuestionIndex: parsed.currentQuestionIndex || 0,
            remainingTime: parsed.remainingTime || testInstance.durationSeconds,
          });
        }
      }
    } catch (e) {
      console.error('Failed to recover session state', e);
    } finally {
      setIsRecovering(false);
    }
  }, [testId, testInstance, sessionId, status, restoreStateFromStorage]);

  return { isRecovering };
}
