import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

export function useExecution(testId: string) {
  const { 
    initializeTest, 
    setLoading, 
    setError, 
    loading, 
    error,
    testInstance 
  } = useExecutionStore();

  useEffect(() => {
    let mounted = true;

    const loadTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await executionService.getTestInstance(testId);
        
        if (mounted) {
          initializeTest(data);
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
  }, [testId, initializeTest, setLoading, setError, testInstance]);

  return { loading, error };
}
