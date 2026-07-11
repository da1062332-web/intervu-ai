import { useMutation } from '@tanstack/react-query';
import { testService } from '@/services/candidate/test.service';

export function useStartTest() {
  return useMutation({
    mutationFn: (configId: string) => testService.startTest(configId),
  });
}
