import { Test, TestingModule } from "@nestjs/testing";
import { BlueprintDto } from "@intervu/shared";
import { AssemblyModule } from "./assembly.module";
import { AssemblyPersistenceService } from "./services/assembly-persistence.service";
import { DistributionAnalyticsService } from "./services/distribution-analytics.service";
import { AssemblyVersionService } from "./services/assembly-version.service";
import { AssemblyPublisherService } from "./services/assembly-publisher.service";
import { BlueprintSimulationService } from "./services/blueprint-simulation.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { QuestionPoolModule } from "../question-pool/question-pool.module";

describe("Assembly Workflow Integration", () => {
  let moduleRef: TestingModule;
  let persistence: AssemblyPersistenceService;
  let analytics: DistributionAnalyticsService;
  let versionService: AssemblyVersionService;
  let publisher: AssemblyPublisherService;
  let simulation: BlueprintSimulationService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, QuestionPoolModule, AssemblyModule],
    }).compile();

    persistence = moduleRef.get(AssemblyPersistenceService);
    analytics = moduleRef.get(DistributionAnalyticsService);
    versionService = moduleRef.get(AssemblyVersionService);
    publisher = moduleRef.get(AssemblyPublisherService);
    simulation = moduleRef.get(BlueprintSimulationService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("should run end-to-end flow without errors", async () => {
    // 1. Blueprint Simulation
    const mockBlueprint: BlueprintDto = {
      testConfigId: "config-1",
      totalQuestions: 10,
      totalDurationSeconds: 600,
      sections: [
        {
          sectionKey: "s-1",
          displayName: "S1",
          durationSeconds: 60,
          questionCount: 2,
          orderIndex: 1,
          topicAllocations: [],
          difficultyDistribution: { EASY: 50, MEDIUM: 50, HARD: 0 },
        },
      ],
    };
    const sim = await simulation.simulate(mockBlueprint);
    expect(sim).toBeDefined();

    // 2. Persistence (Save Assembly)
    const id = await persistence.saveAssembly(
      "mock-config",
      [
        {
          sectionKey: "s1",
          displayName: "S1",
          durationSeconds: 60,
          questionCount: 2,
          orderIndex: 1,
          questions: [],
        },
      ],
      "user-1",
    );
    expect(id).toBeDefined();

    // 3. Analytics
    const stats = await analytics.buildAnalytics(id);
    expect(stats).toBeDefined();

    // 4. Versioning
    const v = await versionService.createVersion(id, "user-1");
    expect(v).toBeDefined();

    // 5. Publish
    const pub = await publisher.publishAssembly(id, "user-1");
    expect(pub).toBeDefined();

    // Cleanup
    await persistence.deleteAssembly(id, "user-1");
  });
});
