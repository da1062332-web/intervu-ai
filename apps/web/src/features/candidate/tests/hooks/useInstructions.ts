import { useQuery } from '@tanstack/react-query';
import { testService } from '@/services/candidate/test.service';
import { InstructionConfig } from '../types/test.types';

export const TEST_INSTRUCTIONS_QUERY_KEY = 'test-instructions';

export function useInstructions(testId: string) {
  return useQuery<InstructionConfig, Error>({
    queryKey: [TEST_INSTRUCTIONS_QUERY_KEY, testId],
    queryFn: () => testService.getInstructions(testId),
    enabled: !!testId,
  });
}
