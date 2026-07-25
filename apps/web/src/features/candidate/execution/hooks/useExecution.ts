import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

export function useExecution(testId: string) {
  const router = useRouter();
  const { initializeTest, setLoading, setError, loading, error, testInstance } =
    useExecutionStore();

  useEffect(() => {
    let mounted = true;

    const loadTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await executionService.getTestInstance(testId);

        if (!mounted) return;

        if (data.status === 'SUBMITTED' || data.status === 'COMPLETED') {
          router.replace(`/candidate/results/${testId}`);
          return;
        }

        if (data.status === 'CREATED' || data.status === 'IN_PROGRESS') {
          initializeTest(data);
        } else {
          // E.g., EXPIRED or CANCELLED, though EXPIRED could route to summary as well if it's considered completed
          router.replace('/candidate/dashboard');
        }
      } catch (err: any) {
        if (mounted) {
          if (err.status === 401) setError('UNAUTHORIZED');
          else if (err.status === 403) setError('FORBIDDEN');
          else if (err.status === 404) setError('NOT_FOUND');
          else if (err.status === 410) setError('EXPIRED');
          else if (err.status === 500) setError('SERVER_ERROR');
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
  }, [testId, initializeTest, setLoading, setError, router]);

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
