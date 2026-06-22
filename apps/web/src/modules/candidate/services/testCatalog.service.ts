import { Test } from '../types/Test';
import { mockTestCatalog } from '../mocks/testCatalog.mock';

export const testCatalogService = {
  /**
   * GET /api/v1/tests
   */
  getTests: async (): Promise<Test[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockTestCatalog);
      }, 300);
    });
  },

  /**
   * GET /api/v1/tests/:id
   */
  getTestById: async (id: string): Promise<Test | null> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const test = mockTestCatalog.find((t) => t.id === id);
        if (test) {
          resolve(test);
        } else {
          reject(new Error(`Test with ID "${id}" not found.`));
        }
      }, 300);
    });
  },
};
