import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examSectionsApi } from './api';
import type { CreateSectionPayload, UpdateSectionPayload } from './types';
import { toast } from 'sonner';

export const useSections = (configId: string) => {
  return useQuery({
    queryKey: ['sections', configId],
    queryFn: () => examSectionsApi.getSections(configId),
    enabled: !!configId,
  });
};

export const useCreateSection = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSectionPayload) => examSectionsApi.createSection(configId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', configId] });
      toast.success('Section created successfully');
    },
    onError: () => {
      toast.error('Failed to create section');
    },
  });
};

export const useUpdateSection = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, payload }: { sectionId: string; payload: UpdateSectionPayload }) =>
      examSectionsApi.updateSection(sectionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', configId] });
      toast.success('Section updated successfully');
    },
    onError: () => {
      toast.error('Failed to update section');
    },
  });
};

export const useDeleteSection = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: string) => examSectionsApi.deleteSection(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', configId] });
      toast.success('Section deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete section');
    },
  });
};
