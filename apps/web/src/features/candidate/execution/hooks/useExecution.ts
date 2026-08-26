import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';
import { clearAssessmentSandboxStorage } from '@/components/candidate/sandbox/useCalculator';

export function useExecution(testId: string) {
  const router = useRouter();
  const { initializeTest, setLoading, setError, resetExecutionState, loading, error, testInstance } =
    useExecutionStore();

  useEffect(() => {
    let mounted = true;

    const loadTest = async () => {
      const t0 = Date.now();
      console.log(`[CLIENT-EXECUTION ⏱️] Loading assessment snapshot for instance: ${testId}...`);
      try {
        // Reset all session-scoped runtime state before loading a new session.
        // This prevents stale state (e.g. submissionStatus: 'SUCCESS' from a previous
        // attempt) from leaking across client-side navigations in the Zustand singleton.
        resetExecutionState();
        setError(null);
        const data = await executionService.getTestInstance(testId);
        const elapsed = Date.now() - t0;
        console.log(`[CLIENT-EXECUTION ✅] Received snapshot in ${elapsed}ms | Status: ${data.status} | Sections: ${data.sections?.length} | Assessment: "${data.assessmentName}"`);

        if (!mounted) return;

        if (data.status === 'SUBMITTED' || data.status === 'COMPLETED') {
          console.log(`[CLIENT-EXECUTION ℹ️] Assessment already completed. Redirecting to results.`);
          clearAssessmentSandboxStorage(testId);
          router.replace(`/candidate/results/${testId}`);
          return;
        }

        if (data.status === 'CREATED' || data.status === 'IN_PROGRESS') {
          console.log(`[CLIENT-EXECUTION 🎯] Initializing execution store and starting test timer...`);
          initializeTest(data);
        } else {
          // E.g., EXPIRED or CANCELLED
          console.warn(`[CLIENT-EXECUTION ⚠️] Assessment status is ${data.status}. Redirecting to dashboard.`);
          clearAssessmentSandboxStorage(testId);
          router.replace('/candidate/dashboard');
        }
      } catch (err: any) {
        console.error(`[CLIENT-EXECUTION ❌] Error loading assessment in ${Date.now() - t0}ms:`, err);
        if (mounted) {
          if (err.status === 401) setError('UNAUTHORIZED');
          else if (err.status === 403) setError('FORBIDDEN');
          else if (err.status === 404) setError('NOT_FOUND');
          else if (err.status === 410) {
            setError('EXPIRED');
            clearAssessmentSandboxStorage(testId);
          } else if (err.status === 500) setError('SERVER_ERROR');
          else setError(err instanceof Error ? err.message : 'Failed to load assessment');
          setLoading(false);
          useExecutionStore.getState().cleanupRuntime();
        }
      }
    };

    if (testId) {
      loadTest();
    }

    return () => {
      mounted = false;
      useExecutionStore.getState().cleanupRuntime();
    };
  }, [testId, initializeTest, setLoading, setError, resetExecutionState, router]);

  useEffect(() => {
    // Push a dummy state to trap the user from going back
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Whenever they press Back or Forward, immediately push the state again
      window.history.pushState(null, '', window.location.href);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard way to trigger the browser's "Leave site?" warning
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return { loading, error };
}
