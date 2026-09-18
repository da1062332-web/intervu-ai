import { apiClient } from '@/services/api/client';
import { MediaAsset, ListMediaParams, ListMediaResponse } from './types';

export const mediaApi = {
  uploadImage: async (file: File, altText?: string): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }
    
    return apiClient.request<MediaAsset>('/media/images', {
      method: 'POST',
      body: formData,
    });
  },

  listMedia: async (params: ListMediaParams): Promise<ListMediaResponse> => {
    return apiClient.request<ListMediaResponse>('/media', {
      method: 'GET',
      query: params as any,
    });
  },

  getMedia: async (id: string): Promise<MediaAsset> => {
    return apiClient.request<MediaAsset>(`/media/${id}`, {
      method: 'GET',
    });
  },
};
