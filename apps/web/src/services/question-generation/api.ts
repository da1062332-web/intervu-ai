import { GeneratedQuestion, GenerationHistoryEntry } from './types';

// In-memory mock storage
let mockGeneratedQuestions: GeneratedQuestion[] = [];
let mockHistory: GenerationHistoryEntry[] = [
  {
    id: 'hist-1',
    templateId: 'temp-1',
    batchSize: 5,
    successCount: 5,
    failureCount: 0,
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const questionGenerationApi = {
  // TODO: Replace with backend API (POST /api/v1/templates/:id/generate)
  generateQuestion: async (templateId: string, payload: any): Promise<GeneratedQuestion> => {
    await delay(1500); // Simulate network latency
    const newQuestion: GeneratedQuestion = {
      id: `q-${Date.now()}`,
      templateId,
      conceptId: payload.conceptId || 'c-1',
      topicId: payload.topicId || 't-1',
      statement: `Mock generated question for template ${templateId}`,
      instructions: 'Please select the correct option.',
      difficulty: 'Medium',
      generationMethod: 'Formula',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload, // Merge any overrides
    };
    mockGeneratedQuestions = [newQuestion, ...mockGeneratedQuestions];
    return newQuestion;
  },

  // TODO: Replace with backend API (POST /api/v1/templates/:id/generate-batch)
  generateBatch: async (templateId: string, count: number, payload: any): Promise<{ success: boolean; count: number }> => {
    await delay(3000); // Simulate longer processing time
    
    const newQuestions: GeneratedQuestion[] = Array.from({ length: count }).map((_, i) => ({
      id: `q-${Date.now()}-${i}`,
      templateId,
      conceptId: payload.conceptId || 'c-1',
      topicId: payload.topicId || 't-1',
      statement: `Mock batch generated question ${i + 1} for template ${templateId}`,
      instructions: 'Please select the correct option.',
      difficulty: 'Medium',
      generationMethod: 'Formula',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload,
    }));

    mockGeneratedQuestions = [...newQuestions, ...mockGeneratedQuestions];
    
    // Add to history
    mockHistory = [{
      id: `hist-${Date.now()}`,
      templateId,
      batchSize: count,
      successCount: count,
      failureCount: 0,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    }, ...mockHistory];

    return { success: true, count };
  },

  // TODO: Replace with backend API (GET /api/v1/templates/:id/generation-history)
  getHistory: async (templateId?: string): Promise<GenerationHistoryEntry[]> => {
    await delay(500);
    if (templateId) {
      return mockHistory.filter(h => h.templateId === templateId);
    }
    return mockHistory;
  },

  // Helper for cross-module mocking: Allow question-pool to access/update this store
  _getMockQuestions: () => mockGeneratedQuestions,
  _setMockQuestions: (q: GeneratedQuestion[]) => { mockGeneratedQuestions = q; }
};
