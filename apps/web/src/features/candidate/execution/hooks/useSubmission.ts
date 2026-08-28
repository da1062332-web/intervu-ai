import { useRouter } from 'next/navigation';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';
import { clearAssessmentSandboxStorage } from '@/components/candidate/sandbox/useCalculator';
import { useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'SkillitriX_execution_autosave';

export function useSubmission(testId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
      localStorage.setItem(`SkillitriX_execution_summary_${testId}`, JSON.stringify(summarySnapshot));

      // On success, clear the local storage so it doesn't resume later
      localStorage.removeItem(`${STORAGE_KEY}_${testId}`);
      clearAssessmentSandboxStorage(testId);

      // Invalidate candidate query caches
      queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-modular'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-progress'] });

      setSubmissionStatus('SUCCESS');

      // Exit fullscreen if active
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }

      // Redirect to the Results Page
      router.push(`/candidate/results/${testId}`);
    } catch (error: any) {
      const isAlreadySubmitted =
        (error?.status === 409 || error?.response?.status === 409) &&
        String(error?.response?.data?.message || error?.message || '')
          .toLowerCase()
          .includes('already submitted');

      if (isAlreadySubmitted) {
        // Invalidate candidate query caches
        queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-modular'] });
        queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['candidate-attempts'] });
        queryClient.invalidateQueries({ queryKey: ['candidate-progress'] });

        setSubmissionStatus('SUCCESS');
        localStorage.removeItem(`${STORAGE_KEY}_${testId}`);
        clearAssessmentSandboxStorage(testId);
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        }
        router.push(`/candidate/results/${testId}`);
        return;
      }

      setSubmissionStatus('FAILED');
    }
  };

  return { submitAssessment };
}
