import { Test, TestingModule } from "@nestjs/testing";
import { RuntimeGeneratorService } from "../services/runtime-generator.service";
import { RuntimeMapperService } from "../services/runtime-mapper.service";
import { RuntimeValidationService } from "../validation/runtime-validation.service";
import { RuntimeMonitoringService } from "../monitoring/runtime-monitoring.service";

describe("Runtime Stress Test - 250 Concurrent Launches", () => {
  let generatorService: RuntimeGeneratorService;

  beforeAll(async () => {
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

  it("should successfully handle 250 concurrent runtime generations within performance limits", async () => {
    const packagePayload: any = {
      assemblyId: "asmb-stress-test",
      configId: "cfg-stress",
      totalDurationSeconds: 7200,
      totalQuestions: 2,
      metadata: { env: "stress" },
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

    const CONCURRENT_REQUESTS = 250;
    const startTime = Date.now();

    const promises = Array.from({ length: CONCURRENT_REQUESTS }).map(() =>
      generatorService.generateRuntime(packagePayload),
    );

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    const totalTimeMs = endTime - startTime;
    const averageTimeMs = totalTimeMs / CONCURRENT_REQUESTS;

    console.log(`\n=================================================`);
    console.log(` STRESS TEST RESULTS (250 CONCURRENT LAUNCHES)`);
    console.log(`=================================================`);
    console.log(` Total Requests Initiated : ${CONCURRENT_REQUESTS}`);
    console.log(` Successful Resolutions   : ${successful}`);
    console.log(` Failed Resolutions       : ${failed}`);
    console.log(` Total Elapsed Time       : ${totalTimeMs} ms`);
    console.log(` Average Time per Request : ${averageTimeMs.toFixed(2)} ms`);
    console.log(`=================================================\n`);

    expect(successful).toBe(CONCURRENT_REQUESTS);
    expect(failed).toBe(0);
    // Average time should be well below 2s
    expect(averageTimeMs).toBeLessThan(2000);
  });
});
