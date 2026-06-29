import { Test, TestingModule } from '@nestjs/testing';
import { AssemblyPublisherService } from './assembly-publisher.service';
import { AssemblyPersistenceService } from './assembly-persistence.service';
import { AssembledTestRepository } from '../repositories/assembled-test.repository';
import { AssemblyAuditService } from './assembly-audit.service';
import { AssemblyVersionService } from './assembly-version.service';
import { BlueprintBuilderService } from './blueprint-builder.service';
import { BadRequestException } from '@nestjs/common';

describe('AssemblyPublisherService', () => {
  let service: AssemblyPublisherService;
  let repo: AssembledTestRepository;
  let moduleRef: TestingModule;
  let auditService: AssemblyAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyPublisherService,
        {
          provide: AssemblyPersistenceService,
          useValue: {
            getAssembly: jest.fn().mockResolvedValue({
              id: 'test-1',
              status: 'DRAFT',
              sections: [{ questions: [{}, {}] }]
            }),
          },
        },
        {
          provide: AssembledTestRepository,
          useValue: {
            updateStatus: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn().mockResolvedValue({
              id: 'test-1',
              status: 'DRAFT',
              sections: []
            }),
          },
        },
        {
          provide: AssemblyAuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AssemblyVersionService,
          useValue: {
            createVersion: jest.fn().mockResolvedValue({ id: 'v1' }),
          },
        },
        {
          provide: BlueprintBuilderService,
          useValue: {
            generateBlueprint: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    moduleRef = module;
    service = module.get<AssemblyPublisherService>(AssemblyPublisherService);
    repo = module.get<AssembledTestRepository>(AssembledTestRepository);
    auditService = module.get<AssemblyAuditService>(AssemblyAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should publish valid assembly', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValueOnce({
      id: 'test-1',
      status: 'DRAFT',
      totalQuestions: 2,
      sections: [{ questions: [{}, {}] }]
    } as unknown as Exclude<Awaited<ReturnType<AssembledTestRepository['findById']>>, null>);

    jest.spyOn(moduleRef.get(BlueprintBuilderService), 'generateBlueprint').mockResolvedValueOnce({
      sections: [{ questionCount: 2 }]
    } as unknown as ReturnType<BlueprintBuilderService['generateBlueprint']>);

    await service.publishAssembly('test-1', 'user-1');
    expect(repo.updateStatus).toHaveBeenCalledWith('test-1', 'PUBLISHED');
    expect(auditService.log).toHaveBeenCalledWith('test-1', 'PUBLISHED', 'user-1', expect.any(Object));
  });

  it('should throw if already published', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValueOnce({
      id: 'test-1',
      status: 'PUBLISHED',
      sections: []
    } as unknown as Exclude<Awaited<ReturnType<AssembledTestRepository['findById']>>, null>);

    await expect(service.publishAssembly('test-1', 'user-1')).rejects.toThrow(BadRequestException);
  });
});
