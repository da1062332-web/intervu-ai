import { useRouter } from 'next/navigation';
import { useExecutionStore } from '../stores/execution.store';

const STORAGE_KEY = 'intervu_execution_autosave';

export function useSubmission(testId: string) {
  const router = useRouter();
  const { setSubmissionStatus, connectionStatus } = useExecutionStore();

  const submitAssessment = async () => {
    if (connectionStatus !== 'ONLINE') {
      setSubmissionStatus('FAILED');
      // In a real app we might still allow local submission or show an error
      // But the requirements say handle network failure
      return;
    }

    setSubmissionStatus('SUBMITTING');

    try {
      // Mock API call to submit answers
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // On success, clear the local storage so it doesn't resume later
      localStorage.removeItem(`${STORAGE_KEY}_${testId}`);

      setSubmissionStatus('SUCCESS');

      // Redirect to results
      router.push(`/candidate/results/${testId}`);
    } catch {
      setSubmissionStatus('FAILED');
    }
  };

  return { submitAssessment };
}
