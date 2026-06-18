import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blueprintsApi } from './api';
import type { CreateBlueprintPayload, UpdateBlueprintPayload } from './types';
import { toast } from 'sonner';

export const useStyleProfiles = () => {
  return useQuery({
    queryKey: ['style-profiles'],
    queryFn: () => blueprintsApi.getStyleProfiles(),
  });
};

export const useCreateStyleProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => blueprintsApi.createStyleProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-profiles'] });
      toast.success('Style profile created successfully');
    },
    onError: () => {
      toast.error('Failed to create style profile');
    },
  });
};

export const useBlueprints = () => {
  return useQuery({
    queryKey: ['blueprints'],
    queryFn: () => blueprintsApi.getBlueprints(),
  });
};

export const useBlueprint = (id: string) => {
  return useQuery({
    queryKey: ['blueprints', id],
    queryFn: () => blueprintsApi.getBlueprint(id),
    enabled: !!id,
  });
};

export const useCreateBlueprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBlueprintPayload) => blueprintsApi.createBlueprint(payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['blueprints', data.id] });
      }
      toast.success('Blueprint saved successfully');
    },
    onError: () => {
      toast.error('Failed to save blueprint');
    },
  });
};

export const useUpdateBlueprint = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBlueprintPayload) => blueprintsApi.updateBlueprint(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      queryClient.invalidateQueries({ queryKey: ['blueprints', id] });
      toast.success('Blueprint updated successfully');
    },
    onError: () => {
      toast.error('Failed to update blueprint');
    },
  });
};

export const useValidateBlueprint = () => {
  return useMutation({
    mutationFn: (id: string) => blueprintsApi.validateBlueprint(id),
    onSuccess: (data) => {
      if (data.valid) {
        toast.success('Blueprint configuration is valid!');
      } else {
        toast.error(`Blueprint has ${data.errors.length} validation errors.`);
      }
    },
    onError: () => {
      toast.error('Validation engine failed to run');
    },
  });
};

export const usePreviewBlueprint = (id: string) => {
  return useQuery({
    queryKey: ['blueprints', id, 'preview'],
    queryFn: () => blueprintsApi.previewBlueprint(id),
    enabled: !!id,
  });
};
