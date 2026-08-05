import { apiClient } from '@/services/api/client';
import {
  TestConfig,
  InstructionConfig,
  ValidationResponse,
} from '@/features/candidate/tests/types/test.types';

// DTO from backend
interface AvailableConfigDto {
  configId: string;
  company: string;
  name: string;
  difficulty: string;
  duration: number;
  sections: string[];
  questionCount?: number;
}

interface StartTestResponse {
  testInstanceId: string;
  status: string;
  instructionsUrl: string;
  durationSeconds: number;
}

export const testService = {
  getTestConfigs: async (): Promise<TestConfig[]> => {
    const response = await apiClient.request<{ configs: any[] }>('/tests/configs', {
      method: 'GET',
    });
    const configs = response.configs || [];
    return configs.map((config) => {
      const parsedSections = (config.sections || []).map((s: any, idx: number) => {
        if (typeof s === 'object' && s !== null) {
          return {
            id: s.id || `section-${idx}`,
            name: s.name || s.displayName || `Section ${idx + 1}`,
            questionCount: Number(s.questionCount) || 0,
            durationMinutes: Number(s.durationMinutes) || (s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0),
          };
        }
        return {
          id: `section-${idx}`,
          name: String(s),
          questionCount: config.questionCount || 0,
          durationMinutes: config.duration ? Math.floor(config.duration / 60) : 0,
        };
      });

      const sumSectionMins = parsedSections.reduce((sum: number, sec: any) => sum + (sec.durationMinutes || 0), 0);
      const sumSectionQs = parsedSections.reduce((sum: number, sec: any) => sum + (sec.questionCount || 0), 0);

      const durationMinutes = sumSectionMins > 0 ? sumSectionMins : (config.durationMinutes || (config.duration ? Math.floor(config.duration / 60) : null));
      const questionCount = sumSectionQs > 0 ? sumSectionQs : (config.questionCount || 0);

      return {
        id: config.configId || config.id,
        company: config.company || null,
        title: config.name || config.title,
        difficulty: config.difficulty || 'Medium',
        durationMinutes,
        questionCount,
        sections: parsedSections,
      };
    });
  },

  getTestDetails: async (id: string): Promise<TestConfig> => {
    const configs = await testService.getTestConfigs();
    const config = configs.find((c: TestConfig) => c.id === id);
    if (!config) {
      try {
        const { executionService } = await import('@/features/candidate/execution/services/execution.service');
        const instance = await executionService.getTestInstance(id);
        if (instance) {
          const matchedConfig = configs.find((c: TestConfig) => c.id === instance.testConfigId);
          if (matchedConfig) {
            return matchedConfig;
          }
          return {
            id: instance.testConfigId || instance.id,
            company: null,
            title: instance.assessmentName || 'In-Progress Assessment',
            difficulty: 'Active Session' as any,
            durationMinutes: Math.ceil((instance.durationSeconds || 3600) / 60),
            questionCount: instance.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0,
            sections: instance.sections?.map((s) => ({
              id: s.id,
              name: s.title || s.sectionKey || 'Section',
              questionCount: s.questions?.length || 0,
              durationMinutes: Math.ceil((s.durationSeconds || 900) / 60),
            })) || [],
          };
        }
      } catch {
        // Fallback to throw below if instance lookup fails
      }
      throw new Error('Assessment not found');
    }
    return config;
  },

  getInstructions: async (id: string): Promise<InstructionConfig> => {
    // Backend currently doesn't provide structured instructions,
    // returning empty system-level fallback.
    return {
      assessmentRules: [
        'Do not refresh the page during the assessment.',
        'Ensure stable internet connection.',
      ],
      navigationRules: ['You can navigate between questions if allowed.'],
      timerRules: ['The timer will not pause if you close the tab.'],
      submissionRules: ['Assessment will automatically submit when time expires.'],
    };
  },

  validateStart: async (_id: string): Promise<ValidationResponse> => {
    return { isEligible: true, errors: [] };
  },

  startTest: async (configId: string): Promise<StartTestResponse> => {
    return await apiClient.request<StartTestResponse>('/tests/start', {
      method: 'POST',
      body: { testConfigId: configId },
    });
  },
};
