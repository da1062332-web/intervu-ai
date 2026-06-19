import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../prisma/prisma.service";

// Note: To run this properly, a test database and valid tokens are needed.
// This is a structured layout for the integration test requested.
describe("Blueprint Config Integration (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup created data
    await prisma.blueprintTopicConfig.deleteMany({});
    await prisma.blueprintConfig.deleteMany({});
    await app.close();
  });

  it("should create blueprint, add topics, validate, fetch detail, and delete", async () => {
    // This is a pseudo-e2e test assuming Auth can be bypassed or mock token provided.
    // In a real environment, you'd use a mock JwtAuthGuard or generate a valid token.

    // 1. Create Blueprint
    const blueprintData = {
      name: "Integration Test BP",
      code: "INT_BP_001",
      totalQuestions: 40,
      totalDurationMinutes: 90,
    };

    // We use service directly to bypass Auth for pure integration logic validation,
    // or assume we have a way to inject mock user if supertest is used.
    // Since AuthGuard is active, we'll verify the service integration directly.
    const service = app.get("BlueprintConfigService");

    const createdBp = await service.create(blueprintData);
    expect(createdBp).toBeDefined();
    expect(createdBp.code).toBe("INT_BP_001");

    // Duplicate Blueprint Code Test
    await expect(service.create(blueprintData)).rejects.toThrow(
      "BLUEPRINT_CODE_EXISTS",
    );

    // 2. Add Topics
    // Topic 1
    await service.addTopicConfig(createdBp.id, {
      sectionId: "sec1",
      topicId: "top1",
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });

    // Duplicate Topic Validation Test
    await expect(
      service.addTopicConfig(createdBp.id, {
        sectionId: "sec1",
        topicId: "top1",
        questionCount: 10,
        weightage: 25,
        easyCount: 3,
        mediumCount: 4,
        hardCount: 3,
      }),
    ).rejects.toThrow("TOPIC_ALREADY_CONFIGURED");

    // Invalid Difficulty Distribution Test
    await expect(
      service.addTopicConfig(createdBp.id, {
        sectionId: "sec1",
        topicId: "top2",
        questionCount: 10,
        weightage: 25,
        easyCount: 1, // 1+1+1 != 10
        mediumCount: 1,
        hardCount: 1,
      }),
    ).rejects.toThrow("INVALID_DIFFICULTY_DISTRIBUTION");

    // 3. Fetch Detail and Validate (Should be Invalid due to < 100 weightage and missing questions)
    const controller = app.get("BlueprintConfigController");
    let detail = await controller.findOne(createdBp.id);

    expect(detail.data.valid).toBe(false);
    expect(detail.data.validationSummary.missingQuestions).toBe(30);
    expect(detail.data.validationSummary.totalWeightage).toBe(25);

    // Add remaining topics to reach 40 questions and 100 weightage
    await service.addTopicConfig(createdBp.id, {
      sectionId: "sec1",
      topicId: "top2",
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });
    await service.addTopicConfig(createdBp.id, {
      sectionId: "sec1",
      topicId: "top3",
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });
    await service.addTopicConfig(createdBp.id, {
      sectionId: "sec1",
      topicId: "top4",
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });

    // 4. Fetch Detail Again (Should be Valid)
    detail = await controller.findOne(createdBp.id);
    expect(detail.data.valid).toBe(true);
    expect(detail.data.validationSummary.missingQuestions).toBe(0);
    expect(detail.data.validationSummary.totalWeightage).toBe(100);

    // 5. Soft Delete Implementation and Tests
    await service.softDelete(createdBp.id);

    const all = await service.findAll();
    const found = all.find((b: { id: string }) => b.id === createdBp.id);
    expect(found).toBeUndefined(); // Should not return deleted blueprint
  });
});
