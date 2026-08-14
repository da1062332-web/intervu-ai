import { BadRequestException, ConflictException } from "@nestjs/common";
import { CodingPatternService } from "../coding-pattern.service";
import { CodingPatternStatus, DifficultyLevel } from "@prisma/client";

describe("CodingPatternService - Oracle Validation & Publishing Invariant", () => {
  let service: CodingPatternService;
  let mockPatternRepo: any;
  let mockOracleService: any;

  beforeEach(() => {
    mockPatternRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    mockOracleService = {
      validateOracleForUsage: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new CodingPatternService(mockPatternRepo, mockOracleService, mockEventEmitter as any);
  });

  it("should create draft pattern cleanly when Oracle is valid", async () => {
    mockOracleService.validateOracleForUsage.mockResolvedValue(undefined);
    mockPatternRepo.findBySlug.mockResolvedValue(null);
    mockPatternRepo.create.mockImplementation((data: any) => Promise.resolve({ id: "pattern-1", ...data }));

    const result = await service.createPattern({
      title: "Array Rotation",
      slug: "array-rotation",
      oracleKey: "ARRAY_ROTATION_ORACLE",
      status: CodingPatternStatus.DRAFT,
    });

    expect(result).toBeDefined();
    expect(mockOracleService.validateOracleForUsage).toHaveBeenCalledWith("ARRAY_ROTATION_ORACLE");
  });

  it("should block creation if Oracle validation fails", async () => {
    mockOracleService.validateOracleForUsage.mockRejectedValue(
      new BadRequestException('Oracle "Inactive Oracle" (INACTIVE_KEY) is currently set to INACTIVE by admin.'),
    );

    await expect(
      service.createPattern({
        title: "Test Pattern",
        slug: "test-pattern",
        oracleKey: "INACTIVE_KEY",
        status: CodingPatternStatus.PUBLISHED,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should enforce Oracle validation when updating pattern status to PUBLISHED", async () => {
    const existingDraft = {
      id: "pattern-1",
      title: "Existing Pattern",
      slug: "existing-pattern",
      oracleKey: "MATH_PRIME_CHECK_ORACLE",
      status: CodingPatternStatus.DRAFT,
    };

    mockPatternRepo.findById.mockResolvedValue(existingDraft);
    mockOracleService.validateOracleForUsage.mockRejectedValue(
      new BadRequestException('Oracle "Prime Number Check Oracle" (MATH_PRIME_CHECK_ORACLE) is currently set to INACTIVE by admin.'),
    );

    await expect(
      service.updatePattern("pattern-1", {
        isPublished: true,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockOracleService.validateOracleForUsage).toHaveBeenCalledWith("MATH_PRIME_CHECK_ORACLE");
  });

  it("should successfully publish pattern when Oracle is active and provider is ready", async () => {
    const existingDraft = {
      id: "pattern-1",
      title: "Existing Pattern",
      slug: "existing-pattern",
      oracleKey: "MATH_PRIME_CHECK_ORACLE",
      status: CodingPatternStatus.DRAFT,
    };

    mockPatternRepo.findById.mockResolvedValue(existingDraft);
    mockOracleService.validateOracleForUsage.mockResolvedValue(undefined);
    mockPatternRepo.update.mockResolvedValue({
      ...existingDraft,
      status: CodingPatternStatus.PUBLISHED,
    });

    const updated = await service.updatePattern("pattern-1", {
      isPublished: true,
    });

    expect(updated.status).toBe(CodingPatternStatus.PUBLISHED);
    expect(mockOracleService.validateOracleForUsage).toHaveBeenCalledWith("MATH_PRIME_CHECK_ORACLE");
  });
});
