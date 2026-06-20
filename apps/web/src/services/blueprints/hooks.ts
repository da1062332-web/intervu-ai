import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blueprintsApi } from './api';
import type {
  CreateBlueprintPayload,
  UpdateBlueprintPayload,
  AddTopicConfigPayload,
} from './types';

// Query Keys
export const blueprintKeys = {
  lists: () => ['blueprints'] as const,
  detail: (id: string) => ['blueprint', id] as const,
};

// Legacy Style Profiles (keeping if needed elsewhere)
export function useStyleProfiles() {
  return useQuery({
    queryKey: ['style-profiles'],
    queryFn: () => blueprintsApi.getStyleProfiles(),
  });
}

export function useCreateStyleProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => blueprintsApi.createStyleProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-profiles'] });
    },
  });
}

// Blueprints
export function useBlueprints() {
  return useQuery({
    queryKey: blueprintKeys.lists(),
    queryFn: () => blueprintsApi.getBlueprints(),
  });
}

export function useBlueprint(id: string) {
  return useQuery({
    queryKey: blueprintKeys.detail(id),
    queryFn: () => blueprintsApi.getBlueprint(id),
    enabled: !!id,
  });
}

export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBlueprintPayload) => blueprintsApi.createBlueprint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.lists() });
    },
  });
}

export function useUpdateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlueprintPayload }) =>
      blueprintsApi.updateBlueprint(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blueprintKeys.detail(variables.id) });
    },
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blueprintsApi.deleteBlueprint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.lists() });
    },
  });
}

export function useAddBlueprintTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddTopicConfigPayload }) =>
      blueprintsApi.addTopicConfig(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blueprintKeys.detail(variables.id) });
    },
  });
}

export function useValidateBlueprint() {
  return useMutation({
    mutationFn: (id: string) => blueprintsApi.validateBlueprint(id),
  });
}

export function usePreviewBlueprint(id: string) {
  return useQuery({
    queryKey: ['blueprint', id, 'preview'] as const,
    queryFn: () => blueprintsApi.previewBlueprint(id),
    enabled: !!id,
  });
}
