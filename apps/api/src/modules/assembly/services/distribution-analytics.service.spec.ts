import { Test, TestingModule } from '@nestjs/testing';
import { DistributionAnalyticsService } from './distribution-analytics.service';
import { AssembledTestRepository } from '../repositories/assembled-test.repository';

describe('DistributionAnalyticsService', () => {
  let service: DistributionAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributionAnalyticsService,
        {
          provide: AssembledTestRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: 'test-1',
              sections: [
                {
                  questions: [
                    { questionSnapshot: { conceptKey: 'React', difficultyLevel: 'HARD' } },
                    { questionSnapshot: { conceptKey: 'Node', difficultyLevel: 'MEDIUM' } },
                  ]
                }
              ]
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DistributionAnalyticsService>(DistributionAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate analytics', async () => {
    const analytics = await service.buildAnalytics('test-1');
    expect(analytics.topicDistribution['React']).toBe(1);
    expect(analytics.topicDistribution['Node']).toBe(1);
    expect(analytics.difficultyDistribution['HARD']).toBe(1);
    expect(analytics.difficultyDistribution['MEDIUM']).toBe(1);
  });
});
