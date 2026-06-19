import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { BlueprintConfigModule } from "../../src/modules/blueprint-config/blueprint-config.module";
import { PrismaModule } from "../../src/prisma/prisma.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { BlueprintConfigService } from "../../src/modules/blueprint-config/blueprint-config.service";
import { BlueprintConfigController } from "../../src/modules/blueprint-config/blueprint-config.controller";

// Note: To run this properly, a test database and valid tokens are needed.
// This is a structured layout for the integration test requested.
describe("Blueprint Config Integration (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let dummyTopicId: string;
  let dummySectionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, BlueprintConfigModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create a dummy exam config to attach section
    const config = await prisma.examConfig.create({
      data: {
        name: "Dummy Config",
        code: "DUMMY_123",
        role: "admin",
        totalQuestions: 10,
        durationMinutes: 10,
      },
    });
    const section = await prisma.examSection.create({
      data: {
        name: "Dummy Sec",
        code: "SEC_1",
        questionCount: 10,
        sectionDurationMinutes: 10,
        sectionOrder: 1,
        examConfigId: config.id,
      },
    });
    const topic = await prisma.topic.create({
      data: { domain: "Test", topicName: "Test Topic", subtopic: "Test Sub" },
    });

    dummySectionId = section.id;
    dummyTopicId = topic.id;
  }, 60000);

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
      isActive: true,
    };

    // We use service directly to bypass Auth for pure integration logic validation,
    // or assume we have a way to inject mock user if supertest is used.
    // Since AuthGuard is active, we'll verify the service integration directly.
    const service = app.get(BlueprintConfigService);

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
      sectionId: dummySectionId,
      topicId: dummyTopicId,
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });

    // Duplicate Topic Validation Test
    await expect(
      service.addTopicConfig(createdBp.id, {
        sectionId: dummySectionId,
        topicId: dummyTopicId,
        questionCount: 10,
        weightage: 25,
        easyCount: 3,
        mediumCount: 4,
        hardCount: 3,
      }),
    ).rejects.toThrow("TOPIC_ALREADY_CONFIGURED");

    // Invalid Difficulty Distribution Test
    const topic2 = await prisma.topic.create({
      data: { domain: "Test", topicName: "T2", subtopic: "T2" },
    });
    await expect(
      service.addTopicConfig(createdBp.id, {
        sectionId: dummySectionId,
        topicId: topic2.id,
        questionCount: 10,
        weightage: 25,
        easyCount: 1, // 1+1+1 != 10
        mediumCount: 1,
        hardCount: 1,
      }),
    ).rejects.toThrow("INVALID_DIFFICULTY_DISTRIBUTION");

    // 3. Fetch Detail and Validate (Should be Invalid due to < 100 weightage and missing questions)
    const controller = app.get(BlueprintConfigController);
    let detail = await controller.findOne(createdBp.id);

    expect(detail.data.valid).toBe(false);
    expect(detail.data.validationSummary.missingQuestions).toBe(30);
    expect(detail.data.validationSummary.totalWeightage).toBe(25);

    // Add remaining topics to reach 40 questions and 100 weightage
    const topic3 = await prisma.topic.create({
      data: { domain: "Test", topicName: "T3", subtopic: "T3" },
    });
    const topic4 = await prisma.topic.create({
      data: { domain: "Test", topicName: "T4", subtopic: "T4" },
    });
    await service.addTopicConfig(createdBp.id, {
      sectionId: dummySectionId,
      topicId: topic2.id,
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });
    await service.addTopicConfig(createdBp.id, {
      sectionId: dummySectionId,
      topicId: topic3.id,
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });
    await service.addTopicConfig(createdBp.id, {
      sectionId: dummySectionId,
      topicId: topic4.id,
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
    const found = all.find((b) => b.id === createdBp.id);
    expect(found).toBeUndefined(); // Should not return deleted blueprint
  }, 30000); // High timeout
});
