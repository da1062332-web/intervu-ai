import { TestInstance } from '../types/execution.types';
import { apiClient } from '@/services/api/client';

// The DTO format for POST /api/v1/tests/:id/answer
export interface CandidateAnswerPayload {
  questionId: string;
  answer: string;
  timeSpentSeconds?: number;
  isMarkedForReview?: boolean;
}

export interface SectionAdvanceResult {
  nextSectionIndex: number | null;
  nextSectionId: string | null;
  serverTime: string;
  isLastSection: boolean;
  submitted: boolean;
}

function isDemoId(id?: string): boolean {
  return !id || id.startsWith('demo-') || id.includes('sandbox');
}

export const executionService = {
  getTestInstance: async (id: string): Promise<TestInstance> => {
    if (isDemoId(id)) {
      throw new Error('Demo mode instances are initialized directly by the demo store.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.request<any>(`/tests/${id}`, { cache: 'no-store' });

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

      // Section timing fields (Feature 5, 6, 7, 8)
      sectionTimingEnabled: true,
      currentSectionIndex: response.currentSectionIndex ?? 0,
      currentQuestionIndex: response.currentQuestionIndex ?? 0,
      serverTime: response.serverTime ?? new Date().toISOString(),

      sections:
        response.sections?.map((section: any) => ({
          id: section.sectionId,
          sectionKey: section.sectionKey,
          title: section.sectionName,
          durationSeconds: section.durationSeconds ?? 0,
          startedAt: section.startedAt ?? null,
          status: section.status ?? 'UPCOMING',

          questions:
            section.questions?.map((q: any) => ({
              id: q.questionId,
              orderIndex: q.questionOrder,
              questionHash: q.snapshot?.questionHash || '',
              type: q.snapshot?.questionType || 'MCQ',
              text: q.snapshot?.questionText || '',
              stem: q.snapshot?.questionStatement || '',
              candidateInstructions: q.snapshot?.instructions || '',
              options: (() => {
                let rawOptions = [];
                if (q.snapshot?.options && q.snapshot.options.length > 0) {
                  rawOptions = q.snapshot.options;
                } else if (q.snapshot?.mcqData?.options && q.snapshot.mcqData.options.length > 0) {
                  rawOptions = q.snapshot.mcqData.options;
                }
                return rawOptions.map((opt: any, idx: number) => {
                  if (typeof opt === 'string') {
                    // Use index-based ID to avoid duplicate key collisions.
                    // The text value is stored separately for backend evaluation.
                    return { id: `opt-${idx}`, text: opt };
                  }
                  return opt;
                });
              })(),
            })) || [],
        })) || [],
    } as TestInstance;
  },

  resumeAssessment: async (id: string): Promise<any> => {
    if (isDemoId(id)) {
      return { success: true, status: 'IN_PROGRESS', resumedAt: new Date().toISOString() };
    }
    return apiClient.request<any>(`/assessment-sessions/${id}/resume`);
  },

  saveAnswer: async (
    testId: string,
    payload: CandidateAnswerPayload,
  ): Promise<{ status?: string }> => {
    if (isDemoId(testId)) {
      return { status: 'SAVED' };
    }
    return apiClient.request(`/tests/${testId}/answer`, {
      method: 'POST',
      body: payload,
    });
  },

  checkpoint: async (id: string, payload: any): Promise<void> => {
    if (isDemoId(id)) {
      return;
    }
    return apiClient.request(`/assessment-sessions/${id}/sync-state`, {
      method: 'POST',
      body: payload,
    });
  },

  submitAssessment: async (
    testId: string,
    options?: { autoSubmit?: boolean; allowPartial?: boolean },
  ): Promise<void> => {
    if (isDemoId(testId)) {
      console.log('[Demo Mode] Assessment submission simulated successfully:', { testId, options });
      return;
    }
    return apiClient.request(`/tests/${testId}/submit`, {
      method: 'POST',
      query: { allowPartial: true, ...options } as Record<string, string | number | boolean>,
    });
  },

  /**
   * Advance to the next section (Feature 8).
   * Locks the current section, activates the next, or triggers auto-submit if last.
   */
  advanceSection: async (testId: string): Promise<SectionAdvanceResult> => {
    if (isDemoId(testId)) {
      return {
        nextSectionIndex: 1,
        nextSectionId: 'demo-sec-next',
        serverTime: new Date().toISOString(),
        isLastSection: false,
        submitted: false,
      };
    }
    return apiClient.request<SectionAdvanceResult>(`/tests/${testId}/sections/advance`, {
      method: 'POST',
    });
  },
};
