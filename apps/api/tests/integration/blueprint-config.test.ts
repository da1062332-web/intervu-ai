import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { BlueprintConfigController } from "../../src/modules/blueprint-config/blueprint-config.controller";
import { BlueprintConfigService } from "../../src/modules/blueprint-config/blueprint-config.service";
import { BlueprintValidatorService } from "../../src/modules/blueprint-config/blueprint-validator.service";
import { BlueprintConfigRepository } from "../../src/modules/blueprint-config/blueprint-config.repository";

describe("Blueprint Config Integration (e2e)", () => {
  let app: INestApplication;
  let service: BlueprintConfigService;
  let controller: BlueprintConfigController;
  
  let configRepoMock: any;

  beforeAll(async () => {
    configRepoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCode: vi.fn(),
      addTopicConfig: vi.fn(),
      findTopicConfigs: vi.fn(),
      softDelete: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BlueprintConfigController],
      providers: [
        BlueprintConfigService,
        BlueprintValidatorService,
        { provide: BlueprintConfigRepository, useValue: configRepoMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    service = app.get<BlueprintConfigService>(BlueprintConfigService);
    controller = app.get<BlueprintConfigController>(BlueprintConfigController);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should create blueprint, add topics, validate, fetch detail, and delete", async () => {
    // 1. Create Blueprint
    const blueprintData = {
      name: "Integration Test BP",
      code: "INT_BP_001",
      totalQuestions: 40,
      totalDurationMinutes: 90,
      isActive: true,
    };

    configRepoMock.findByCode.mockResolvedValueOnce(null);
    configRepoMock.create.mockResolvedValueOnce({
      id: "bp-1",
      ...blueprintData,
    });

    const createdBp = await service.create(blueprintData);
    expect(createdBp).toBeDefined();
    expect(createdBp.code).toBe("INT_BP_001");

    // Duplicate Blueprint Code Test
    configRepoMock.findByCode.mockResolvedValueOnce({ id: "bp-1", ...blueprintData });
    await expect(service.create(blueprintData)).rejects.toThrow(
      "BLUEPRINT_CODE_EXISTS",
    );

    // 2. Add Topics
    configRepoMock.findById.mockResolvedValue({ id: "bp-1", totalQuestions: 40 });
    configRepoMock.findTopicConfigs.mockResolvedValue([]);
    configRepoMock.addTopicConfig.mockResolvedValueOnce({ id: "tc-1" });

    await service.addTopicConfig("bp-1", {
      sectionId: "sec-1",
      topicId: "top-1",
      questionCount: 10,
      weightage: 25,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    });

    // Duplicate Topic Validation Test
    configRepoMock.findTopicConfigs.mockResolvedValue([{ topicId: "top-1" }]);
    await expect(
      service.addTopicConfig("bp-1", {
        sectionId: "sec-1",
        topicId: "top-1",
        questionCount: 10,
        weightage: 25,
        easyCount: 3,
        mediumCount: 4,
        hardCount: 3,
      }),
    ).rejects.toThrow("TOPIC_ALREADY_CONFIGURED");

    // Invalid Difficulty Distribution Test
    configRepoMock.findTopicConfigs.mockResolvedValue([]);
    await expect(
      service.addTopicConfig("bp-1", {
        sectionId: "sec-1",
        topicId: "top-2",
        questionCount: 10,
        weightage: 25,
        easyCount: 1, // 1+1+1 != 10
        mediumCount: 1,
        hardCount: 1,
      }),
    ).rejects.toThrow("INVALID_DIFFICULTY_DISTRIBUTION");

    // 3. Fetch Detail and Validate (Should be Invalid due to < 100 weightage and missing questions)
    configRepoMock.findById.mockResolvedValue({
      id: "bp-1",
      totalQuestions: 40,
      topicConfigs: [
        { questionCount: 10, weightage: 25, topic: { topicName: "T1" }, examSection: { name: "S1" } }
      ]
    });

    let detail = await controller.findOne("bp-1");
    expect(detail.data.valid).toBe(false);
    expect(detail.data.validationSummary.missingQuestions).toBe(30);
    expect(detail.data.validationSummary.totalWeightage).toBe(25);

    // 4. Fetch Detail Again (Should be Valid)
    configRepoMock.findById.mockResolvedValue({
      id: "bp-1",
      totalQuestions: 40,
      topicConfigs: [
        { questionCount: 10, weightage: 25, topic: { topicName: "T1" }, examSection: { name: "S1" } },
        { questionCount: 10, weightage: 25, topic: { topicName: "T2" }, examSection: { name: "S1" } },
        { questionCount: 10, weightage: 25, topic: { topicName: "T3" }, examSection: { name: "S1" } },
        { questionCount: 10, weightage: 25, topic: { topicName: "T4" }, examSection: { name: "S1" } }
      ]
    });
    detail = await controller.findOne("bp-1");
    expect(detail.data.valid).toBe(true);
    expect(detail.data.validationSummary.missingQuestions).toBe(0);
    expect(detail.data.validationSummary.totalWeightage).toBe(100);

    // 5. Soft Delete Implementation and Tests
    configRepoMock.softDelete.mockResolvedValueOnce({ id: "bp-1", deletedAt: new Date() });
    await service.softDelete("bp-1");
    expect(configRepoMock.softDelete).toHaveBeenCalledWith("bp-1");
  });
});
