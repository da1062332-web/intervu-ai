import { Test, TestingModule } from "@nestjs/testing";
import { DifficultyDistributionService } from "../services/difficulty-distribution.service";
import { DifficultyDistributionRepository } from "../repositories/difficulty-distribution.repository";
import { BadRequestException } from "@nestjs/common";

describe("DifficultyDistributionService", () => {
  let service: DifficultyDistributionService;
  let repository: jest.Mocked<DifficultyDistributionRepository>;

  const mockConfigId = "d8f8d6d4-8d9e-4f1a-b6e9-9c5d8a8b1c1d";

  beforeEach(async () => {
    const repositoryMock = {
      findByConfigId: jest.fn(),
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DifficultyDistributionService,
        {
          provide: DifficultyDistributionRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<DifficultyDistributionService>(
      DifficultyDistributionService,
    );
    repository = module.get(DifficultyDistributionRepository);
  });

  it("should get difficulty distribution", async () => {
    repository.findByConfigId.mockResolvedValue({
      id: "dist-1",
      examConfigId: mockConfigId,
      easyCount: 1,
      mediumCount: 2,
      hardCount: 3,
      totalQuestions: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.getDifficultyDistribution(mockConfigId);
    expect(result).toBeDefined();
    expect(result?.totalQuestions).toBe(6);
    expect(repository.findByConfigId).toHaveBeenCalledWith(mockConfigId);
  });

  it("should calculate total and upsert", async () => {
    repository.upsert.mockResolvedValue({
      id: "dist-1",
      examConfigId: mockConfigId,
      easyCount: 1,
      mediumCount: 2,
      hardCount: 3,
      totalQuestions: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.updateDifficultyDistribution(mockConfigId, {
      easyCount: 1,
      mediumCount: 2,
      hardCount: 3,
    });

    expect(result.totalQuestions).toBe(6);
    expect(repository.upsert).toHaveBeenCalledWith(mockConfigId, {
      easyCount: 1,
      mediumCount: 2,
      hardCount: 3,
      totalQuestions: 6,
    });
  });

  it("should throw INVALID_DISTRIBUTION if total is 0", async () => {
    await expect(
      service.updateDifficultyDistribution(mockConfigId, {
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
      }),
    ).rejects.toThrow(
      new BadRequestException({
        code: "INVALID_DISTRIBUTION",
        message: "At least one question must exist.",
      }),
    );
  });

  it("should throw INVALID_DISTRIBUTION if any count is negative", async () => {
    await expect(
      service.updateDifficultyDistribution(mockConfigId, {
        easyCount: -1,
        mediumCount: 2,
        hardCount: 0,
      }),
    ).rejects.toThrow(
      new BadRequestException({
        code: "INVALID_DISTRIBUTION",
        message: "Question counts cannot be negative",
      }),
    );
  });
});
