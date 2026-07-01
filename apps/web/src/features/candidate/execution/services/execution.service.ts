import { TestInstance } from '../types/execution.types';
import { apiClient } from '@/services/api/client';

// The DTO format for POST /api/v1/tests/:id/answer
export interface CandidateAnswerPayload {
  questionId: string;
  answer: string;
  timeSpentSeconds?: number;
  isMarkedForReview?: boolean;
}

export const executionService = {
  getTestInstance: async (id: string): Promise<TestInstance> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.request<any>(`/tests/${id}`);

    // Calculate remaining duration if expiresAt is provided
    let duration = 3600;
    if (response.expiresAt) {
      const expires = new Date(response.expiresAt).getTime();
      const now = new Date().getTime();
      duration = Math.max(0, Math.floor((expires - now) / 1000));
    }

    // Map backend AssessmentSnapshotResponse to frontend TestInstance
    return {
      id: response.testInstanceId,
      testConfigId: response.testConfigId,
      userId: response.userId || 'candidate-id',
      assessmentName: response.assessmentName || 'Candidate Assessment',
      candidateName: response.candidateName || 'Candidate',
      status: response.status,
      durationSeconds: response.durationSeconds || duration,

      sections:
        response.sections?.map((section: any) => ({
          id: section.sectionId,
          sectionKey: section.sectionKey,
          title: section.sectionName,

          questions:
            section.questions?.map((q: any) => ({
              id: q.questionId,
              orderIndex: q.questionOrder,
              questionHash: q.snapshot?.questionHash || '',
              type: q.snapshot?.questionType || 'MCQ',
              text: q.snapshot?.questionText || '',
              options: q.snapshot?.options || [],
            })) || [],
        })) || [],
    } as TestInstance;
  },

  resumeAssessment: async (id: string): Promise<any> => {
    return apiClient.request<any>(`/tests/${id}/resume`);
  },

  saveAnswer: async (testId: string, payload: CandidateAnswerPayload): Promise<void> => {
    return apiClient.request(`/tests/${testId}/answer`, {
      method: 'POST',
      body: payload,
    });
  },

  submitAssessment: async (testId: string): Promise<void> => {
    return apiClient.request(`/tests/${testId}/submit`, {
      method: 'POST',
    });
  },
};
