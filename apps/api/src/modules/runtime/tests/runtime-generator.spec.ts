import { Test, TestingModule } from '@nestjs/testing';
import { RuntimeGeneratorService } from '../services/runtime-generator.service';
import { RuntimeMapperService } from '../services/runtime-mapper.service';
import { RuntimeValidationService } from '../validation/runtime-validation.service';
import { RuntimeMonitoringService } from '../monitoring/runtime-monitoring.service';

describe('RuntimeGeneratorService', () => {
  let service: RuntimeGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuntimeGeneratorService,
        RuntimeMapperService,
        RuntimeValidationService,
        {
          provide: RuntimeMonitoringService,
          useValue: {
            trackBuildStarted: jest.fn(),
            trackBuildCompleted: jest.fn(),
            trackBuildFailed: jest.fn(),
            trackValidationPassed: jest.fn(),
            trackValidationFailed: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RuntimeGeneratorService>(RuntimeGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if validation fails', async () => {
    const invalidPackage: any = {
      assemblyId: 'asmb-1',
      totalDurationSeconds: -100,
      sections: [],
    };

    await expect(service.generateRuntime(invalidPackage)).rejects.toThrow(
      'Runtime validation failed',
    );
  });

  it('should successfully map and validate a valid package', async () => {
    const validPackage: any = {
      assemblyId: 'asmb-valid',
      configId: 'config-1',
      totalDurationSeconds: 3600,
      metadata: { key: 'value' },
      sections: [
        {
          sectionKey: 'sec-1',
          displayName: 'Sec 1',
          durationSeconds: 1800,
          questionCount: 1,
          questions: [
            {
              questionId: 'q-1',
              questionType: 'MULTIPLE_CHOICE',
              questionText: 'Valid?',
              options: ['Yes', 'No'],
            },
          ],
        },
      ],
    };

    const result = await service.generateRuntime(validPackage);
    expect(result.testId).toBe('asmb-valid');
    expect(result.duration).toBe(3600);
    expect(result.sections.length).toBe(1);
  });
});
