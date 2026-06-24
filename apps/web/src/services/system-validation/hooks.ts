import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemValidationApi } from './api';
import { useSystemValidationStore } from '@/store/system-validation.store';
import { toast } from 'sonner';

export const useSystemValidation = (configId: string) => {
  return useQuery({
    queryKey: ['system-validation', configId],
    queryFn: async () => {
      if (!configId) return null;
      const result = await systemValidationApi.validateConfig(configId);
      useSystemValidationStore.getState().setValidationResult(result);
      return result;
    },
    enabled: !!configId,
  });
};

export const runSystemValidation = (configId: string) => {
  const queryClient = useQueryClient();
  const setLoading = useSystemValidationStore((s) => s.setLoading);
  const setValidationResult = useSystemValidationStore((s) => s.setValidationResult);
  const setError = useSystemValidationStore((s) => s.setError);

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {
        const result = await systemValidationApi.validateConfig(configId);
        setValidationResult(result);
        return result;
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Validation failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-validation', configId] });
      toast.success('Cross-module validation completed');
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast.error(error.message || 'Failed to validate configuration');
    },
  });
};
