import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';

const STORAGE_KEY = 'intervu_execution_autosave';

export function useResume(testId: string | undefined) {
  const { restoreStateFromStorage, testInstance } = useExecutionStore();

  useEffect(() => {
    if (!testId || !testInstance) return;

    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${testId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && typeof parsed.currentQuestionIndex === 'number') {
          restoreStateFromStorage(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to resume assessment from local storage', e);
    }
  }, [testId, testInstance, restoreStateFromStorage]);
}
