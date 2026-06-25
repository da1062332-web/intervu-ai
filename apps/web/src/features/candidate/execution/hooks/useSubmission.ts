import { useRouter } from 'next/navigation';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

const STORAGE_KEY = 'intervu_execution_autosave';

export function useSubmission(testId: string) {
  const router = useRouter();
  const { setSubmissionStatus, connectionStatus } = useExecutionStore();

  const submitAssessment = async () => {
    if (connectionStatus !== 'ONLINE') {
      setSubmissionStatus('FAILED');
      return;
    }

    setSubmissionStatus('SUBMITTING');

    try {
      await executionService.submitAssessment(testId);

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

      // Redirect to the new Assessment Completion Page
      router.push(`/assessment/submitted?testId=${testId}`);
    } catch {
      setSubmissionStatus('FAILED');
    }
  };

  return { submitAssessment };
}
