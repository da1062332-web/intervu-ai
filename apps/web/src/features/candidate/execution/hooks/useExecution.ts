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
          router.replace(`/candidate/tests/${testId}/summary`);
          return;
        }

        if (data.status === 'CREATED' || data.status === 'IN_PROGRESS') {
          initializeTest(data);
        } else {
          // E.g., EXPIRED or CANCELLED, though EXPIRED could route to summary as well if it's considered completed
          router.replace('/candidate/dashboard');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load assessment');
          setLoading(false);
        }
      }
    };

    if (testId && !testInstance) {
      loadTest();
    } else if (testInstance && testInstance.id !== testId) {
      // If we somehow loaded a different test, reload
      loadTest();
    }

    return () => {
      mounted = false;
    };
  }, [testId, initializeTest, setLoading, setError, testInstance, router]);

  return { loading, error };
}
