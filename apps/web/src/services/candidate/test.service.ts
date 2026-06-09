import {
  TestConfig,
  InstructionConfig,
  ValidationResponse,
} from '@/features/candidate/tests/types/test.types';
import {
  mockTestConfig,
  mockInstructionConfig,
  mockValidationResponseEligible,
} from '@/features/candidate/tests/mocks/tests.mock';

export const testService = {
  getTestConfigs: async (): Promise<TestConfig[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([mockTestConfig]), 500));
  },

  getTestDetails: async (id: string): Promise<TestConfig> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Return mock regardless of ID for demo purposes,
        // or properly handle if it doesn't match the mock ID.
        if (id === mockTestConfig.id || id) {
          resolve(mockTestConfig);
        } else {
          reject(new Error('Assessment not found'));
        }
      }, 500);
    });
  },

  getInstructions: async (id: string): Promise<InstructionConfig> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (id === mockTestConfig.id || id) {
          resolve(mockInstructionConfig);
        } else {
          reject(new Error('Assessment instructions not found'));
        }
      }, 500);
    });
  },

  validateStart: async (_id: string): Promise<ValidationResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockValidationResponseEligible);
      }, 500);
    });
  },
};
