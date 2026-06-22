import { useQuery } from '@tanstack/react-query';
import { testCatalogService } from '../services/testCatalog.service';

export function useInstructions(id: string) {
  const query = useQuery({
    queryKey: ['candidate-instructions-modular', id],
    queryFn: async () => {
      // For instruction configuration, we can fetch the test overview or static/dynamic instructions list
      const test = await testCatalogService.getTestById(id);
      if (!test) throw new Error('Test not found');

      return {
        testTitle: test.title,
        company: test.company,
        generalRules: [
          'You must have a stable internet connection throughout the test.',
          'Do not refresh the page or use the browser back button.',
          'Calculators and external aids are not permitted unless specified.',
          'You are monitored via webcam, microphone, and browser window focus tracking.',
        ],
        navigationRules: [
          'You can navigate between questions within the active section.',
          'Once a section is submitted, you cannot return to it.',
          'Unanswered questions will receive zero marks (no negative marking).',
        ],
        technicalRequirements: [
          'Webcam and microphone must be enabled and functional.',
          'Latest version of Chrome, Firefox, or Edge is required.',
          'Dual-screen setups or external projection is strictly forbidden.',
        ],
      };
    },
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
