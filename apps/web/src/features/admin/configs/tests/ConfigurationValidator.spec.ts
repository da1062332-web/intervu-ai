import { ConfigurationReadinessService } from '../services/ConfigurationReadinessService';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import * as api from '../services/api';
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  topicsApi: { getTopics: vi.fn() },
  conceptsApi: { getConcepts: vi.fn() },
  templatesApi: { getTemplates: vi.fn() },
  weightagesApi: { getWeightages: vi.fn() },
}));

describe('ConfigurationValidator', () => {
  it('blocks Generation Ready if weightages are not 100%', async () => {
    const topics = [{ topicId: 't1', topicName: 'Topic 1' } as SectionTopicResponse];

    // Mock the APIs to return incomplete weightages
    (api.weightagesApi.getWeightages as any).mockResolvedValue([{ weightagePercentage: 80 }]);
    (api.conceptsApi.getConcepts as any).mockResolvedValue([{ id: 'c1', name: 'Concept 1' }]);

    const readiness = await ConfigurationReadinessService.validate('s1', topics);

    expect(readiness.valid).toBe(false);
    expect(readiness.errors).toContain('Total weightage must be exactly 100%');
  });

  it('allows Generation Ready if everything is complete', async () => {
    const topics = [{ topicId: 't1', topicName: 'Topic 1' } as SectionTopicResponse];

    // Mock the APIs to return complete weightages
    (api.weightagesApi.getWeightages as any).mockResolvedValue([{ weightagePercentage: 100 }]);
    (api.conceptsApi.getConcepts as any).mockResolvedValue([{ id: 'c1', name: 'Concept 1' }]);

    const readiness = await ConfigurationReadinessService.validate('s1', topics);

    expect(readiness.valid).toBe(true);
  });
});
