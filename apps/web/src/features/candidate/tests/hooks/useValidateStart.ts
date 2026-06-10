import { useMutation } from '@tanstack/react-query';
import { testService } from '@/services/candidate/test.service';
import { ValidationResponse } from '../types/test.types';

export function useValidateStart() {
  return useMutation<ValidationResponse, Error, string>({
    mutationFn: (testId: string) => testService.validateStart(testId),
  });
}
