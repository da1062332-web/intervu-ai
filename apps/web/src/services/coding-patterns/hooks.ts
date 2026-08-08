import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCodingPatterns,
  getCodingPattern,
  createCodingPattern,
  updateCodingPattern,
  deleteCodingPattern,
  previewCodingPattern,
  PreviewCodingPatternPayload,
  CodingPattern,
} from './api';

export const CODING_PATTERNS_KEY = ['coding-patterns'];

export function useCodingPatterns(page = 1, limit = 20, search?: string) {
  return useQuery({
    queryKey: [...CODING_PATTERNS_KEY, page, limit, search],
    queryFn: () => getCodingPatterns(page, limit, search),
  });
}

export function useCodingPattern(id: string) {
  return useQuery({
    queryKey: [...CODING_PATTERNS_KEY, id],
    queryFn: () => getCodingPattern(id),
    enabled: !!id && id !== 'new',
  });
}

export function useCreateCodingPattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CodingPattern>) => createCodingPattern(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODING_PATTERNS_KEY });
    },
  });
}

export function useUpdateCodingPattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CodingPattern> }) =>
      updateCodingPattern(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CODING_PATTERNS_KEY });
      queryClient.invalidateQueries({ queryKey: [...CODING_PATTERNS_KEY, variables.id] });
    },
  });
}

export function useDeleteCodingPattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCodingPattern(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODING_PATTERNS_KEY });
    },
  });
}

export function usePreviewCodingPattern() {
  return useMutation({
    mutationFn: (payload: PreviewCodingPatternPayload) => previewCodingPattern(payload),
  });
}
