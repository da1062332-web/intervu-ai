import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readinessService } from '../services/readiness.service';
import { useReadinessStore } from '@/store/readiness.store';
import { toast } from 'sonner';

export const useReadiness = (configId: string) => {
  return useQuery({
    queryKey: ['readiness', configId],
    queryFn: async () => {
      const report = await readinessService.getReadiness(configId);
      useReadinessStore.getState().setReadinessReport(report);
      return report;
    },
    enabled: !!configId,
  });
};

export const useGenerateReadiness = (configId: string) => {
  const queryClient = useQueryClient();
  const setGenerating = useReadinessStore((s) => s.setGenerating);
  const setReport = useReadinessStore((s) => s.setReadinessReport);
  const setError = useReadinessStore((s) => s.setError);

  return useMutation({
    mutationFn: async () => {
      setGenerating(true);
      try {
        const report = await readinessService.generateReadiness(configId);
        setReport(report);
        return report;
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Failed to generate readiness report');
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readiness', configId] });
      toast.success('Readiness report re-evaluated successfully');
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast.error(error.message || 'Failed to generate readiness report');
    },
  });
};
