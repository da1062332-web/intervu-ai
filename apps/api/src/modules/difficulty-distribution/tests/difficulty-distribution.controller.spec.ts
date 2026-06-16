import { Test, TestingModule } from '@nestjs/testing';
import { DifficultyDistributionController } from '../controllers/difficulty-distribution.controller';
import { DifficultyDistributionService } from '../services/difficulty-distribution.service';
import { NotFoundException } from '@nestjs/common';

describe('DifficultyDistributionController', () => {
  let controller: DifficultyDistributionController;
  let service: jest.Mocked<DifficultyDistributionService>;

  const mockConfigId = 'd8f8d6d4-8d9e-4f1a-b6e9-9c5d8a8b1c1d';

  beforeEach(async () => {
    const serviceMock = {
      getDifficultyDistribution: jest.fn(),
      updateDifficultyDistribution: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DifficultyDistributionController],
      providers: [
        {
          provide: DifficultyDistributionService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<DifficultyDistributionController>(DifficultyDistributionController);
    service = module.get(DifficultyDistributionService);
  });

  it('should call updateDifficultyDistribution on PUT', async () => {
    service.updateDifficultyDistribution.mockResolvedValue({
      id: 'dist-1',
      examConfigId: mockConfigId,
      easyCount: 1,
      mediumCount: 2,
      hardCount: 3,
      totalQuestions: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto = { easyCount: 1, mediumCount: 2, hardCount: 3 };
    const result = await controller.update(mockConfigId, dto);
    expect(result.totalQuestions).toBe(6);
    expect(service.updateDifficultyDistribution).toHaveBeenCalledWith(mockConfigId, dto);
  });

  it('should call getDifficultyDistribution on GET', async () => {
    service.getDifficultyDistribution.mockResolvedValue({
      id: 'dist-1',
      examConfigId: mockConfigId,
      easyCount: 1,
      mediumCount: 2,
      hardCount: 3,
      totalQuestions: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await controller.findOne(mockConfigId);
    expect(result.totalQuestions).toBe(6);
  });

  it('should throw NotFoundException if GET returns null', async () => {
    service.getDifficultyDistribution.mockResolvedValue(null);

    await expect(controller.findOne(mockConfigId)).rejects.toThrow(
      new NotFoundException({
        code: "DISTRIBUTION_NOT_FOUND",
        message: "Difficulty distribution not found for this config",
      })
    );
  });
});
