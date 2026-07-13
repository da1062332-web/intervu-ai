import { useRouter } from 'next/navigation';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

const STORAGE_KEY = 'intervu_execution_autosave';

export function useSubmission(testId: string) {
  const router = useRouter();
  const { setSubmissionStatus, connectionStatus } = useExecutionStore();

  const submitAssessment = async (options?: { autoSubmit?: boolean; allowPartial?: boolean }) => {
    if (connectionStatus !== 'ONLINE') {
      setSubmissionStatus('FAILED');
      return;
    }

    setSubmissionStatus('SUBMITTING');

    try {
      await executionService.submitAssessment(testId, options);

      // Save a snapshot for the summary page before clearing
      const summarySnapshot = {
        testInstance: useExecutionStore.getState().testInstance,
        answers: useExecutionStore.getState().answers,
        remainingTime: useExecutionStore.getState().remainingTime,
        questions: useExecutionStore.getState().questions,
      };
      localStorage.setItem(`intervu_execution_summary_${testId}`, JSON.stringify(summarySnapshot));

      // On success, clear the local storage so it doesn't resume later
      localStorage.removeItem(`${STORAGE_KEY}_${testId}`);

      setSubmissionStatus('SUCCESS');

      // Exit fullscreen if active
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }

      // Redirect to the new Assessment Completion Page
      router.push(`/assessment/submitted?testId=${testId}`);
    } catch {
      setSubmissionStatus('FAILED');
    }
  };

  return { submitAssessment };
}
