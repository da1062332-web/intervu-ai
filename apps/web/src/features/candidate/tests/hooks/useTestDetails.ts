import { useQuery } from '@tanstack/react-query';
import { testService } from '@/services/candidate/test.service';
import { TestConfig } from '../types/test.types';

export const TEST_DETAILS_QUERY_KEY = 'test-details';

export function useTestDetails(testId: string) {
  return useQuery<TestConfig, Error>({
    queryKey: [TEST_DETAILS_QUERY_KEY, testId],
    queryFn: () => testService.getTestDetails(testId),
    enabled: !!testId,
  });
}
