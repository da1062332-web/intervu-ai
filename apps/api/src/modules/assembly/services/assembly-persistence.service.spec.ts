import { Test, TestingModule } from '@nestjs/testing';
import { AssemblyPersistenceService } from './assembly-persistence.service';
import { AssembledTestRepository } from '../repositories/assembled-test.repository';
import { AssemblyAuditService } from './assembly-audit.service';

describe('AssemblyPersistenceService', () => {
  let service: AssemblyPersistenceService;
  let repo: AssembledTestRepository;
  let auditService: AssemblyAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyPersistenceService,
        {
          provide: AssembledTestRepository,
          useValue: {
            createAssemblyWithTransaction: jest.fn().mockResolvedValue('test-assembly-id'),
            replaceAssemblyWithTransaction: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn().mockResolvedValue({ id: 'test-assembly-id', totalQuestions: 10, totalDurationSeconds: 600, status: 'DRAFT' }),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AssemblyAuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AssemblyPersistenceService>(AssemblyPersistenceService);
    repo = module.get<AssembledTestRepository>(AssembledTestRepository);
    auditService = module.get<AssemblyAuditService>(AssemblyAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save assembly and log creation', async () => {
    const id = await service.saveAssembly('config-1', [], 'user-1');
    expect(id).toBe('test-assembly-id');
    expect(repo.createAssemblyWithTransaction).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      'test-assembly-id',
      'CREATED',
      'user-1',
      expect.any(Object),
    );
  });

  it('should update assembly and log update', async () => {
    await service.updateAssembly('test-assembly-id', [], 'user-1');
    expect(repo.replaceAssemblyWithTransaction).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      'test-assembly-id',
      'UPDATED',
      'user-1',
      expect.any(Object),
    );
  });

  it('should delete assembly and log deletion', async () => {
    await service.deleteAssembly('test-assembly-id', 'user-1');
    expect(repo.delete).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      'test-assembly-id',
      'DELETED',
      'user-1',
      expect.any(Object),
    );
  });
});
