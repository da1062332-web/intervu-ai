import { Test, TestingModule } from "@nestjs/testing";
import { DifficultyDistributionService } from "../services/difficulty-distribution.service";
import { DifficultyDistributionRepository } from "../repositories/difficulty-distribution.repository";
import { ConfigNotFoundError, BaseError } from "@intervu/shared";

describe("DifficultyDistributionService", () => {
  let service: DifficultyDistributionService;
  let repository: jest.Mocked<DifficultyDistributionRepository>;

  const mockConfigId = "d8f8d6d4-8d9e-4f1a-b6e9-9c5d8a8b1c1d";

  beforeEach(async () => {
    const repositoryMock = {
      findByConfigId: jest.fn(),
      upsert: jest.fn(),
      checkConfigExists: jest.fn(),
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
    repository.checkConfigExists.mockResolvedValue(true);
    repository.findByConfigId.mockResolvedValue({
      id: "dist-1",
      examConfigId: mockConfigId,
      easyPercentage: 20,
      mediumPercentage: 50,
      hardPercentage: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.getDifficultyDistribution(mockConfigId);
    expect(result).toBeDefined();
    expect(result?.easyPercentage).toBe(20);
    expect(repository.findByConfigId).toHaveBeenCalledWith(mockConfigId);
  });

  it("should check config exists and throw ConfigNotFoundError on get if config doesn't exist", async () => {
    repository.checkConfigExists.mockResolvedValue(false);
    await expect(
      service.getDifficultyDistribution(mockConfigId),
    ).rejects.toThrow(ConfigNotFoundError);
  });

  it("should calculate total and upsert", async () => {
    repository.checkConfigExists.mockResolvedValue(true);
    repository.upsert.mockResolvedValue({
      id: "dist-1",
      examConfigId: mockConfigId,
      easyPercentage: 20,
      mediumPercentage: 50,
      hardPercentage: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.updateDifficultyDistribution(mockConfigId, {
      easyPercentage: 20,
      mediumPercentage: 50,
      hardPercentage: 30,
    });

    expect(result.easyPercentage).toBe(20);
    expect(repository.upsert).toHaveBeenCalledWith(mockConfigId, {
      easyPercentage: 20,
      mediumPercentage: 50,
      hardPercentage: 30,
    });
  });

  it("should throw INVALID_DISTRIBUTION_TOTAL if total is not 100", async () => {
    repository.checkConfigExists.mockResolvedValue(true);
    await expect(
      service.updateDifficultyDistribution(mockConfigId, {
        easyPercentage: 10,
        mediumPercentage: 20,
        hardPercentage: 30,
      }),
    ).rejects.toThrow(
      new BaseError(
        "INVALID_DISTRIBUTION_TOTAL",
        "Difficulty distribution total must be exactly 100%",
      ),
    );
  });

  it("should throw INVALID_DISTRIBUTION if any count is negative", async () => {
    repository.checkConfigExists.mockResolvedValue(true);
    await expect(
      service.updateDifficultyDistribution(mockConfigId, {
        easyPercentage: -10,
        mediumPercentage: 80,
        hardPercentage: 30,
      }),
    ).rejects.toThrow(
      new BaseError("INVALID_DISTRIBUTION", "Percentages cannot be negative"),
    );
  });
});
