import { Test, TestingModule } from '@nestjs/testing';
import { AssemblyVersionService } from './assembly-version.service';
import { AssemblyVersionRepository } from '../repositories/assembly-version.repository';
import { AssemblyPersistenceService } from './assembly-persistence.service';

import { AssemblyAuditService } from './assembly-audit.service';
import { AssembledTestRepository } from '../repositories/assembled-test.repository';

describe('AssemblyVersionService', () => {
  let service: AssemblyVersionService;
  let versionRepo: AssemblyVersionRepository;
  let auditService: AssemblyAuditService;
  let assembledTestRepo: AssembledTestRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyVersionService,
        {
          provide: AssemblyVersionRepository,
          useValue: {
            createVersion: jest.fn().mockResolvedValue({ id: 'v-1' }),
            listVersions: jest.fn().mockResolvedValue([{ id: 'v-1' }]),
            getVersion: jest.fn().mockResolvedValue({ id: 'v-1', snapshotData: { sections: [] } }),
            getLatestVersionNumber: jest.fn().mockResolvedValue(1),
            findById: jest.fn().mockResolvedValue({
              id: 'v-1',
              version: 1,
              assemblyId: 'test-1',
              snapshot: { sections: [], totalDurationSeconds: 100, totalQuestions: 10 }
            }),
          },
        },
        {
          provide: AssemblyPersistenceService,
          useValue: {
            getAssembly: jest.fn().mockResolvedValue({ id: 'test-1', sections: [] }),
            updateAssembly: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AssemblyAuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AssembledTestRepository,
          useValue: {
            replaceAssemblyWithTransaction: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AssemblyVersionService>(AssemblyVersionService);
    versionRepo = module.get<AssemblyVersionRepository>(AssemblyVersionRepository);
    auditService = module.get<AssemblyAuditService>(AssemblyAuditService);
    assembledTestRepo = module.get<AssembledTestRepository>(AssembledTestRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create version and log', async () => {
    await service.createVersion('test-1', 'user-1');
    expect(versionRepo.createVersion).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith('test-1', 'VERSION_CREATED', 'user-1', expect.any(Object));
  });

  it('should restore version and log', async () => {
    await service.restoreVersion('test-1', 'v-1', 'user-1');
    expect(assembledTestRepo.replaceAssemblyWithTransaction).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith('test-1', 'VERSION_RESTORED', 'user-1', expect.any(Object));
  });
});
