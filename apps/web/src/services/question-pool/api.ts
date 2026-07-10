import { questionGenerationApi } from '../question-generation/api';
import { GeneratedQuestion, QuestionFilters } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const questionPoolApi = {
  // TODO: Replace with backend API (GET /api/v1/questions/generated)
  getGeneratedQuestions: async (filters?: QuestionFilters): Promise<GeneratedQuestion[]> => {
    await delay(800);
    let questions = questionGenerationApi._getMockQuestions();

    if (filters) {
      if (filters.status) questions = questions.filter((q) => q.status === filters.status);
      if (filters.difficulty)
        questions = questions.filter((q) => q.difficulty === filters.difficulty);
      if (filters.topicId) questions = questions.filter((q) => q.topicId === filters.topicId);
      if (filters.conceptId) questions = questions.filter((q) => q.conceptId === filters.conceptId);
      if (filters.templateId)
        questions = questions.filter((q) => q.templateId === filters.templateId);
      if (filters.search) {
        const query = filters.search.toLowerCase();
        questions = questions.filter(
          (q) => q.statement.toLowerCase().includes(query) || q.id.toLowerCase().includes(query),
        );
      }
    }
    return questions;
  },

  // TODO: Replace with backend API (POST /api/v1/questions/:id/approve)
  approveQuestion: async (id: string): Promise<GeneratedQuestion> => {
    await delay(600);
    const questions = questionGenerationApi._getMockQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');

    questions[index] = {
      ...questions[index],
      status: 'Approved',
      updatedAt: new Date().toISOString(),
    };
    questionGenerationApi._setMockQuestions(questions);
    return questions[index];
  },

  // TODO: Replace with backend API (POST /api/v1/questions/:id/reject)
  rejectQuestion: async (id: string): Promise<GeneratedQuestion> => {
    await delay(600);
    const questions = questionGenerationApi._getMockQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');

    questions[index] = {
      ...questions[index],
      status: 'Rejected',
      updatedAt: new Date().toISOString(),
    };
    questionGenerationApi._setMockQuestions(questions);
    return questions[index];
  },

  // TODO: Replace with backend API (POST /api/v1/questions/:id/publish)
  publishQuestion: async (id: string): Promise<GeneratedQuestion> => {
    await delay(600);
    const questions = questionGenerationApi._getMockQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');

    questions[index] = {
      ...questions[index],
      status: 'Published',
      updatedAt: new Date().toISOString(),
    };
    questionGenerationApi._setMockQuestions(questions);
    return questions[index];
  },

  // TODO: Replace with backend API (PATCH /api/v1/questions/:id)
  updateQuestion: async (
    id: string,
    payload: Partial<GeneratedQuestion>,
  ): Promise<GeneratedQuestion> => {
    await delay(800);
    const questions = questionGenerationApi._getMockQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');

    questions[index] = { ...questions[index], ...payload, updatedAt: new Date().toISOString() };
    questionGenerationApi._setMockQuestions(questions);
    return questions[index];
  },

  // TODO: Replace with backend API (POST /api/v1/questions/:id/regenerate)
  regenerateQuestion: async (id: string): Promise<GeneratedQuestion> => {
    await delay(2000);
    const questions = questionGenerationApi._getMockQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');

    // Simulate regeneration by altering statement slightly
    questions[index] = {
      ...questions[index],
      statement: `${questions[index].statement} (Regenerated at ${new Date().toLocaleTimeString()})`,
      status: 'Draft',
      updatedAt: new Date().toISOString(),
    };
    questionGenerationApi._setMockQuestions(questions);
    return questions[index];
  },
};
