import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from './api';
import { ListMediaParams } from './types';

export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (filters: ListMediaParams) => [...mediaKeys.lists(), filters] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
};

export const useUploadImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, altText }: { file: File; altText?: string }) => 
      mediaApi.uploadImage(file, altText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
};

export const useListMedia = (params: ListMediaParams) => {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => mediaApi.listMedia(params),
    staleTime: 30 * 1000, // 30s
  });
};
