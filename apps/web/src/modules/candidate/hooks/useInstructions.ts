import { useQuery } from '@tanstack/react-query';
import { testService } from '@/services/candidate/test.service';

export function useInstructions(testId: string) {
  const query = useQuery({
    queryKey: ['candidate-instructions', testId],
    queryFn: async () => {
      // First get test details to ensure test exists
      const test = await testService.getTestDetails(testId);
      
      if (!test) {
        throw new Error('Test not found');
      }

      // Then get instructions from API using the new service
      return testService.getInstructions(testId);
    },
    enabled: !!testId,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
