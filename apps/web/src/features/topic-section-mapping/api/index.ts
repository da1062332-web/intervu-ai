import { apiClient } from '@/services/api/client';
import { SectionTopicResponse } from '@intervu-ai/contracts';

export const sectionTopicsApi = {
  getSectionTopics: async (sectionId: string) => {
    return apiClient.request<SectionTopicResponse[]>(`/admin/sections/${sectionId}/topics`);
  },
};
