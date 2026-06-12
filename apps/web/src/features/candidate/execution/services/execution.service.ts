import { TestInstance, Question } from '../types/execution.types';
import { mockTestInstance } from '../mocks/execution.mock';

export const executionService = {
  getTestInstance: async (id: string): Promise<TestInstance> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (id) {
          // Just return mock data for any ID right now
          resolve(mockTestInstance);
        } else {
          reject(new Error('Assessment not found'));
        }
      }, 800); // simulate network latency
    });
  },

  getCurrentQuestion: async (testId: string, questionId: string): Promise<Question> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const question = mockTestInstance.sections
          .flatMap((s) => s.questions)
          .find((q) => q.id === questionId);

        if (question) {
          resolve(question);
        } else {
          reject(new Error('Question not found'));
        }
      }, 300);
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveAnswer: async (_testId: string, _questionId: string, _answerId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock save success
        resolve();
      }, 300);
    });
  },
};
