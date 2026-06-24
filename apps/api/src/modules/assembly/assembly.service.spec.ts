import { Test, TestingModule } from "@nestjs/testing";
import { AssemblyService } from "./services/test-assembly.service";
import { AssemblyRepository } from "./repositories/assembly.repository";
import { BlueprintBuilderService } from "./services/blueprint-builder.service";
import { QuestionAllocatorService } from "./services/question-allocator.service";
import { SectionBuilderService } from "./services/section-builder.service";
import { AssemblyValidatorService } from "./validators/assembly-validator.service";
import { QuestionPoolRepository } from "./repositories/question-pool.repository";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { BlueprintDto } from "@intervu/shared";
describe("AssemblyService", () => {
  let service: AssemblyService;
  let repository: jest.Mocked<AssemblyRepository>;
  let blueprintBuilder: jest.Mocked<BlueprintBuilderService>;
  let allocator: jest.Mocked<QuestionAllocatorService>;
  let sectionBuilder: jest.Mocked<SectionBuilderService>;
  let validator: jest.Mocked<AssemblyValidatorService>;
  let poolRepository: jest.Mocked<QuestionPoolRepository>;

  beforeEach(async () => {
    repository = {
      createTestInstanceWithTransaction: jest.fn(),
      findById: jest.fn(),
      findByCandidate: jest.fn(),
    } as unknown as jest.Mocked<AssemblyRepository>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyService,
        { provide: AssemblyRepository, useValue: repository },
        { provide: BlueprintBuilderService, useValue: blueprintBuilder },
        { provide: QuestionAllocatorService, useValue: allocator },
        { provide: SectionBuilderService, useValue: sectionBuilder },
        { provide: AssemblyValidatorService, useValue: validator },
        { provide: QuestionPoolRepository, useValue: poolRepository },
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
    repository.createTestInstanceWithTransaction.mockResolvedValueOnce(
      "instance-uuid",
    );

    const result = await service.assembleTest("config-1");
    expect(blueprintBuilder.generateBlueprint).toHaveBeenCalledWith("config-1");
    expect(result).toBe("instance-uuid");
  });

  it("ASM-008 Persistence Success", async () => {
    blueprintBuilder.generateBlueprint.mockResolvedValueOnce({
      sections: [],
    } as unknown as BlueprintDto);
    validator.validate.mockReturnValueOnce({ valid: true, errors: [] });
    repository.createTestInstanceWithTransaction.mockResolvedValueOnce(
      "success-uuid",
    );

    const result = await service.assembleTest("config-1");
    expect(repository.createTestInstanceWithTransaction).toHaveBeenCalled();
    expect(result).toBe("success-uuid");
  });
});
