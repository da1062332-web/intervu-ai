import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conceptMappingApi } from './api';
import type { CreateConceptPayload, UpdateConceptPayload } from './types';
import { toast } from 'sonner';

export const useConcepts = (topicId: string, activeOnly = true) => {
  return useQuery({
    queryKey: ['concepts', topicId, activeOnly],
    queryFn: () => conceptMappingApi.getConcepts(topicId, activeOnly),
    enabled: !!topicId,
  });
};

export const useCreateConcept = (topicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConceptPayload) =>
      conceptMappingApi.createConcept(topicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concepts', topicId] });
      toast.success('Concept created successfully');
    },
    onError: () => {
      toast.error('Failed to create concept');
    },
  });
};

export const useUpdateConcept = (topicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conceptId, payload }: { conceptId: string; payload: UpdateConceptPayload }) =>
      conceptMappingApi.updateConcept(conceptId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concepts', topicId] });
      toast.success('Concept updated successfully');
    },
    onError: () => {
      toast.error('Failed to update concept');
    },
  });
};

export const useDeactivateConcept = (topicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conceptId: string) => conceptMappingApi.deactivateConcept(conceptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concepts', topicId] });
      toast.success('Concept deactivated successfully');
    },
    onError: () => {
      toast.error('Failed to deactivate concept');
    },
  });
};
