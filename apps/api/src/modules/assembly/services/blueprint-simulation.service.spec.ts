import { Test, TestingModule } from '@nestjs/testing';
import { BlueprintSimulationService } from './blueprint-simulation.service';
import { BlueprintDto } from '@intervu/shared';

describe('BlueprintSimulationService', () => {
  let service: BlueprintSimulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlueprintSimulationService],
    }).compile();

    service = module.get<BlueprintSimulationService>(BlueprintSimulationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should simulate blueprint correctly', async () => {
    const blueprint: BlueprintDto = {
      testConfigId: 'bp-1',
      totalQuestions: 5,
      totalDurationSeconds: 600,
      sections: [
        {
          sectionKey: 's-1',
          displayName: 'Sec 1',
          durationSeconds: 600,
          questionCount: 5,
          orderIndex: 1,
          topicAllocations: [],
          difficultyDistribution: { EASY: 20, MEDIUM: 60, HARD: 20 },
        },
      ],
    };

    const simulation = await service.simulate(blueprint);
    expect(simulation.totalQuestions).toBe(5);
    expect(simulation.estimatedDifficulty).toBe('MEDIUM');
    expect(simulation.sections[0].estimatedDuration).toBe(600); // from durationSeconds mock
  });
});
