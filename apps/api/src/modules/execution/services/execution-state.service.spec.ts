import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionStateService } from './execution-state.service';
import { ExecutionStateRepository } from '../repositories';
import { ExecutionState } from '@prisma/client';

describe('ExecutionStateService', () => {
  let service: ExecutionStateService;
  let repo: jest.Mocked<ExecutionStateRepository>;

  beforeEach(async () => {
    const repoMock = {
      findAll: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      withTransaction: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionStateService,
        {
          provide: ExecutionStateRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<ExecutionStateService>(ExecutionStateService);
    repo = module.get(ExecutionStateRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveProgress', () => {
    it('should update existing state if found', async () => {
      repo.findAll.mockResolvedValueOnce([{ id: 'state_1' } as unknown as ExecutionState]);
      repo.update.mockResolvedValueOnce({ id: 'state_1', currentQuestionIndex: 1, remainingTimeSeconds: 500 } as unknown as ExecutionState);

      const result = await service.saveProgress('test_1', 1, 500);

      expect(repo.findAll).toHaveBeenCalledWith({ testInstanceId: 'test_1' });
      expect(repo.update).toHaveBeenCalledWith('state_1', expect.objectContaining({
        currentQuestionIndex: 1,
        remainingTimeSeconds: 500,
      }));
      expect(result.remainingTimeSeconds).toBe(500);
    });

    it('should create new state if none exists', async () => {
      repo.findAll.mockResolvedValueOnce([]);
      repo.create.mockResolvedValueOnce({ id: 'state_new', currentQuestionIndex: 2, remainingTimeSeconds: 300 } as unknown as ExecutionState);

      const result = await service.saveProgress('test_2', 2, 300);

      expect(repo.findAll).toHaveBeenCalledWith({ testInstanceId: 'test_2' });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        currentQuestionIndex: 2,
        remainingTimeSeconds: 300,
      }));
      expect(result.id).toBe('state_new');
    });
  });

  describe('restoreProgress', () => {
    it('should return null if no state', async () => {
      repo.findAll.mockResolvedValueOnce([]);
      const result = await service.restoreProgress('test_1');
      expect(result).toBeNull();
    });

    it('should return first state if exists', async () => {
      repo.findAll.mockResolvedValueOnce([{ id: 'state_1', currentQuestionIndex: 5 } as unknown as ExecutionState]);
      const result = await service.restoreProgress('test_1');
      expect(result?.currentQuestionIndex).toBe(5);
    });
  });
});
