import { apiClient } from '@/services/api/client';
import { ManualQuestion, ManualQuestionFilters } from './types';

export const manualQuestionsApi = {
  getQuestions: async (filters?: ManualQuestionFilters) => {
    const res = await apiClient.request<any>('/manual-questions', {
      method: 'GET',
      query: filters as any,
    });
    const items = Array.isArray(res) ? res : (res?.data || res?.items || []);
    return items.map((q: any) => ({
      ...q,
      options: q.options || q.mcqData?.options || [],
    }));
  },

  searchQuestions: async (query?: any) => {
    const res = await apiClient.request<any>('/manual-questions/search', {
      method: 'GET',
      query,
    });
    const items = Array.isArray(res) ? res : (res?.data || res?.items || []);
    return items.map((q: any) => ({
      ...q,
      options: q.options || q.mcqData?.options || [],
    }));
  },

  getQuestionById: async (id: string) => {
    const res = await apiClient.request<any>(`/manual-questions/${id}`, {
      method: 'GET',
    });
    const item = res?.data || res;
    return {
      ...item,
      options: item?.options || item?.mcqData?.options || [],
    };
  },

  createQuestion: async (payload: Partial<ManualQuestion>) => {
    const desiredStatus = payload.status;
    
    // Always create as DRAFT first to respect backend lifecycle constraints
    const created = await apiClient.request<ManualQuestion>('/manual-questions', {
      method: 'POST',
      body: { ...payload, status: 'DRAFT' },
    });

    // If ACTIVE was requested, use the update API to perform the 2-step bypass
    if (desiredStatus === 'ACTIVE') {
      try {
        await manualQuestionsApi.updateQuestion(created.id, { status: 'ACTIVE' }, 'DRAFT');
        created.status = 'ACTIVE';
      } catch (e) {
        // If promotion fails, it remains in DRAFT
      }
    } else if (desiredStatus === 'VALIDATED') {
      try {
        await manualQuestionsApi.updateQuestion(created.id, { status: 'VALIDATED' }, 'DRAFT');
        created.status = 'VALIDATED';
      } catch (e) {}
    }
    
    return created;
  },

  updateQuestion: async (id: string, payload: Partial<ManualQuestion>, currentStatus?: string) => {
    if (payload.status === 'ACTIVE' && currentStatus === 'DRAFT') {
      try {
        await apiClient.request(`/manual-questions/${id}`, {
          method: 'PATCH',
          body: { status: 'VALIDATED' },
        });
      } catch (e) {
        // Continue to step 2 even if this fails, just in case it was already validated
      }
    }
    return apiClient.request<ManualQuestion>(`/manual-questions/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteQuestion: async (id: string) => {
    return apiClient.request<void>(`/manual-questions/${id}`, {
      method: 'DELETE',
    });
  },
};
