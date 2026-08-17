import { Test, TestingModule } from "@nestjs/testing";
import { AssemblyPersistenceService } from "./services/assembly-persistence.service";
import { AssemblyService } from "./services/test-assembly.service";
import { BlueprintBuilderService } from "./services/blueprint-builder.service";
import { QuestionAllocatorService } from "./services/question-allocator.service";
import { SectionBuilderService } from "./services/section-builder.service";
import { AssemblyValidatorService } from "./validators/assembly-validator.service";
import { QuestionPoolRepository } from "./repositories/question-pool.repository";
import { AssembledTestRepository } from "./repositories/assembled-test.repository";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { BlueprintDto } from "@intervu/shared";

describe("AssemblyService", () => {
  let service: AssemblyService;
  let persistenceService: jest.Mocked<AssemblyPersistenceService>;
  let blueprintBuilder: jest.Mocked<BlueprintBuilderService>;
  let allocator: jest.Mocked<QuestionAllocatorService>;
  let sectionBuilder: jest.Mocked<SectionBuilderService>;
  let validator: jest.Mocked<AssemblyValidatorService>;
  let poolRepository: jest.Mocked<QuestionPoolRepository>;
  let assembledTestRepository: jest.Mocked<AssembledTestRepository>;

  beforeEach(async () => {
    persistenceService = {
      saveAssembly: jest.fn(),
    } as unknown as jest.Mocked<AssemblyPersistenceService>;

    blueprintBuilder = {
      generateBlueprint: jest.fn(),
    } as unknown as jest.Mocked<BlueprintBuilderService>;

    allocator = {
      allocateQuestions: jest.fn(),
    } as unknown as jest.Mocked<QuestionAllocatorService>;

    sectionBuilder = {
      buildSection: jest.fn(),
    } as unknown as jest.Mocked<SectionBuilderService>;

    validator = {
      validate: jest.fn(),
    } as unknown as jest.Mocked<AssemblyValidatorService>;

    poolRepository = {
      findRecentUsedQuestions: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<QuestionPoolRepository>;

    assembledTestRepository = {
      findLatestReusableByConfigId: jest.fn(),
    } as unknown as jest.Mocked<AssembledTestRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyService,
        { provide: AssemblyPersistenceService, useValue: persistenceService },
        { provide: BlueprintBuilderService, useValue: blueprintBuilder },
        { provide: QuestionAllocatorService, useValue: allocator },
        { provide: SectionBuilderService, useValue: sectionBuilder },
        { provide: AssemblyValidatorService, useValue: validator },
        { provide: QuestionPoolRepository, useValue: poolRepository },
        { provide: AssembledTestRepository, useValue: assembledTestRepository },
      ],
    }).compile();

    service = module.get<AssemblyService>(AssemblyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("ASM-001 Blueprint Creation - generates blueprint correctly", async () => {
    blueprintBuilder.generateBlueprint.mockResolvedValueOnce({
      testConfigId: "config-1",
      totalQuestions: 10,
      totalDurationSeconds: 1800,
      sections: [
        {
          sectionKey: "s1",
          displayName: "Section 1",
          durationSeconds: 1200,
          questionCount: 10,
          orderIndex: 0,
          topicAllocations: [{ topicId: "mockTopic", percentage: 100 }],
        },
      ],
    });
    allocator.allocateQuestions.mockResolvedValueOnce([]);
    sectionBuilder.buildSection.mockReturnValueOnce(
      {} as unknown as SectionDto,
    );
    validator.validate.mockReturnValueOnce({ valid: true, errors: [] });
    persistenceService.saveAssembly.mockResolvedValueOnce("instance-uuid");

    const result = await service.assembleTest("config-1");
    expect(blueprintBuilder.generateBlueprint).toHaveBeenCalledWith("config-1");
    expect(result).toBe("instance-uuid");
  });

  it("ASM-008 Persistence Success", async () => {
    blueprintBuilder.generateBlueprint.mockResolvedValueOnce({
      totalQuestions: 5,
      sections: [
        {
          sectionKey: "s1",
          displayName: "Section 1",
          durationSeconds: 1200,
          questionCount: 5,
          orderIndex: 0,
          topicAllocations: [],
        },
      ],
    } as unknown as BlueprintDto);
    allocator.allocateQuestions.mockResolvedValueOnce([]);
    sectionBuilder.buildSection.mockReturnValueOnce(
      {} as unknown as SectionDto,
    );
    validator.validate.mockReturnValueOnce({ valid: true, errors: [] });
    persistenceService.saveAssembly.mockResolvedValueOnce("success-uuid");

    const result = await service.assembleTest("config-1");
    expect(persistenceService.saveAssembly).toHaveBeenCalled();
    expect(result).toBe("success-uuid");
  });

  it("throws BadRequestException when pre-assembly readiness check fails (no sections)", async () => {
    blueprintBuilder.generateBlueprint.mockResolvedValueOnce({
      totalQuestions: 5,
      sections: [],
    } as unknown as BlueprintDto);

    await expect(service.assembleTest("config-empty")).rejects.toThrow();
  });

  it("reuses an existing published assembly snapshot when available", async () => {
    assembledTestRepository.findLatestReusableByConfigId.mockResolvedValueOnce({
      id: "existing-assembly-id",
      configId: "config-1",
      status: "PUBLISHED",
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      examConfig: { updatedAt: new Date("2023-12-31T00:00:00.000Z") },
    } as any);

    const result = await service.assembleTest("config-1");

    expect(result).toBe("existing-assembly-id");
    expect(blueprintBuilder.generateBlueprint).not.toHaveBeenCalled();
    expect(persistenceService.saveAssembly).not.toHaveBeenCalled();
  });
});
