import { apiClient } from '@/services/api/client';
import { MediaAsset, ListMediaParams, ListMediaResponse } from './types';

export const mediaApi = {
  uploadImage: async (
    file: File,
    options?: { altText?: string; folder?: string; topicId?: string; topicSlug?: string; topicName?: string } | string,
  ): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (typeof options === 'string') {
      if (options) formData.append('altText', options);
    } else if (options) {
      if (options.altText) formData.append('altText', options.altText);
      if (options.folder) formData.append('folder', options.folder);
      if (options.topicId) formData.append('topicId', options.topicId);
      if (options.topicSlug) formData.append('topicSlug', options.topicSlug);
      if (options.topicName) formData.append('topicName', options.topicName);
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
