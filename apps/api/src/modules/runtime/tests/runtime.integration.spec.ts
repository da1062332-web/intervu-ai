import { Test, TestingModule } from "@nestjs/testing";
import { RuntimeGeneratorService } from "../services/runtime-generator.service";
import { RuntimeMapperService } from "../services/runtime-mapper.service";
import { RuntimeValidationService } from "../validation/runtime-validation.service";
import { RuntimeMonitoringService } from "../monitoring/runtime-monitoring.service";

describe("Runtime Integration (Flow)", () => {
  let generatorService: RuntimeGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuntimeGeneratorService,
        RuntimeMapperService,
        RuntimeValidationService,
        {
          provide: RuntimeMonitoringService,
          useValue: {
            trackBuildStarted: jest.fn(),
            trackBuildCompleted: jest.fn(),
            trackBuildFailed: jest.fn(),
            trackValidationPassed: jest.fn(),
            trackValidationFailed: jest.fn(),
          },
        },
      ],
    }).compile();

    generatorService = module.get<RuntimeGeneratorService>(
      RuntimeGeneratorService,
    );
  });

  it("should successfully map and validate an entire package flow", async () => {
    const packagePayload: any = {
      assemblyId: "asmb-integration",
      configId: "cfg-1",
      totalDurationSeconds: 7200,
      totalQuestions: 2,
      metadata: { env: "test" },
      sections: [
        {
          sectionKey: "sec-1",
          displayName: "Aptitude",
          durationSeconds: 3600,
          questionCount: 1,
          questions: [
            {
              questionId: "q-1",
              questionOrder: 1,
              questionType: "MULTIPLE_CHOICE",
              questionText: "Test?",
              options: ["A", "B"],
            },
          ],
        },
        {
          sectionKey: "sec-2",
          displayName: "Technical",
          durationSeconds: 3600,
          questionCount: 1,
          questions: [
            {
              questionId: "q-2",
              questionOrder: 1,
              questionType: "SUBJECTIVE",
              questionText: "Explain testing",
            },
          ],
        },
      ],
    };

    const runtimeTest = await generatorService.generateRuntime(packagePayload);
    expect(runtimeTest).toBeDefined();
    expect(runtimeTest.sections?.length).toBe(2);
    expect(runtimeTest.sections?.[0]?.questions?.[0]?.questionId).toBe("q-1");
  });

  it("should fail flow for missing sections", async () => {
    const packagePayload: any = {
      assemblyId: "asmb-integration",
      configId: "cfg-1",
      totalDurationSeconds: 7200,
      totalQuestions: 0,
      metadata: { env: "test" },
      sections: [],
    };

    await expect(
      generatorService.generateRuntime(packagePayload),
    ).rejects.toThrow("Runtime validation failed");
  });
});
