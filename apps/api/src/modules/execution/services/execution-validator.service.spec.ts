import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionValidatorService } from './execution-validator.service';
import { TestInstanceRepository } from '../repositories';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('ExecutionValidatorService', () => {
  let service: ExecutionValidatorService;
  let repo: jest.Mocked<TestInstanceRepository>;

  beforeEach(async () => {
    const repoMock = {
      findById: jest.fn(),
      withTransaction: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionValidatorService,
        {
          provide: TestInstanceRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<ExecutionValidatorService>(ExecutionValidatorService);
    repo = module.get(TestInstanceRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAssessment', () => {
    it('should throw NotFound if assessment is missing', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.validateAssessment('test_1')).rejects.toThrow(NotFoundException);
    });

    it('should return assessment if exists', async () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      repo.findById.mockResolvedValueOnce({ id: 'test_1' } as any);
      const res = await service.validateAssessment('test_1');
      expect(res.id).toBe('test_1');
    });
  });

  describe('validateOwnership', () => {
    it('should throw Forbidden if user is different', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => service.validateOwnership({ userId: 'user_1' } as any, 'user_2')).toThrow(ForbiddenException);
    });

    it('should not throw if user matches', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => service.validateOwnership({ userId: 'user_1' } as any, 'user_1')).not.toThrow();
    });
  });

  describe('validateSubmissionState', () => {
    it('should throw Conflict if already submitted', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => service.validateSubmissionState({ status: 'SUBMITTED' } as any)).toThrow(ConflictException);
    });

    it('should not throw if active', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => service.validateSubmissionState({ status: 'ACTIVE' } as any)).not.toThrow();
    });
  });
});
