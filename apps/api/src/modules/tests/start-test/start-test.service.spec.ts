import { Test, TestingModule } from "@nestjs/testing";
import { StartTestService } from "./start-test.service";
import { EligibilityService } from "../../lifecycle/eligibility.service";
import { TestConfigRepository } from "../repositories/test-config.repository";
import { QuestionProviderService } from "./question-provider.service";
import { TestInstanceService } from "../test-instance/test-instance.service";
import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { TestInstanceStatus } from "@prisma/client";

describe("StartTestService", () => {
  let service: StartTestService;
  let eligibilityService: jest.Mocked<EligibilityService>;
  let testConfigRepository: { findByIdWithSections: jest.Mock };
  let questionProvider: jest.Mocked<QuestionProviderService>;
  let testInstanceService: jest.Mocked<TestInstanceService>;

  beforeEach(async () => {
    const eligibilityMock = {
      validateEligibility: jest.fn(),
    };
    const testConfigRepositoryMock = {
      findByIdWithSections: jest.fn(),
    };
    const questionProviderMock = {
      fetchOrGenerateQuestions: jest.fn(),
    };
    const testInstanceMock = {
      createTestInstance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartTestService,
        { provide: EligibilityService, useValue: eligibilityMock },
        { provide: TestConfigRepository, useValue: testConfigRepositoryMock },
        { provide: QuestionProviderService, useValue: questionProviderMock },
        { provide: TestInstanceService, useValue: testInstanceMock },
      ],
    }).compile();

    service = module.get<StartTestService>(StartTestService);
    eligibilityService = module.get(EligibilityService);
    testConfigRepository = module.get(TestConfigRepository);
    questionProvider = module.get(QuestionProviderService);
    testInstanceService = module.get(TestInstanceService);
  });

  const validUserId = "user-1";
  const validConfigId = "config-1";

  it("START-001 Valid Creation", async () => {
    eligibilityService.validateEligibility.mockResolvedValue({
      eligible: true,
    });
    testConfigRepository.findByIdWithSections.mockResolvedValue({
      id: validConfigId,
      totalDurationSeconds: 3600,
      sections: [{ sectionKey: "js-basics", questionCount: 5 }],
    });
    questionProvider.fetchOrGenerateQuestions.mockResolvedValue([
      { questionHash: "hash-1" },
      { questionHash: "hash-2" },
      { questionHash: "hash-3" },
      { questionHash: "hash-4" },
      { questionHash: "hash-5" },
    ]);
    testInstanceService.createTestInstance.mockResolvedValue({
      id: "test-inst-1",
      status: TestInstanceStatus.CREATED,
      sections: [],
    } as unknown as Awaited<
      ReturnType<typeof testInstanceService.createTestInstance>
    >);

    const result = await service.startTest(validUserId, {
      testConfigId: validConfigId,
    });
    expect(result.testInstanceId).toBe("test-inst-1");
    expect(result.status).toBe(TestInstanceStatus.CREATED);
  });

  it("START-002 Missing Config", async () => {
    eligibilityService.validateEligibility.mockResolvedValue({
      eligible: true,
    });
    testConfigRepository.findByIdWithSections.mockResolvedValue(null);

    await expect(
      service.startTest(validUserId, { testConfigId: "invalid" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("START-003 Inactive Config / START-004 User Ineligible", async () => {
    eligibilityService.validateEligibility.mockResolvedValue({
      eligible: false,
      reason: "USER_NOT_ELIGIBLE",
    });

    await expect(
      service.startTest(validUserId, { testConfigId: validConfigId }),
    ).rejects.toThrow(BadRequestException);
  });

  it("START-005 Empty Pool", async () => {
    eligibilityService.validateEligibility.mockResolvedValue({
      eligible: true,
    });
    testConfigRepository.findByIdWithSections.mockResolvedValue({
      id: validConfigId,
      totalDurationSeconds: 3600,
      sections: [{ sectionKey: "js-basics", questionCount: 5 }],
    });
    questionProvider.fetchOrGenerateQuestions.mockRejectedValue(
      new InternalServerErrorException({ code: "QUESTION_POOL_EMPTY" }),
    );

    await expect(
      service.startTest(validUserId, { testConfigId: validConfigId }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it("START-006 Transaction Rollback / Assembly Failed", async () => {
    eligibilityService.validateEligibility.mockResolvedValue({
      eligible: true,
    });
    testConfigRepository.findByIdWithSections.mockResolvedValue({
      id: validConfigId,
      sections: [{ sectionKey: "js-basics", questionCount: 5 }],
    });
    questionProvider.fetchOrGenerateQuestions.mockResolvedValue([]);
    testInstanceService.createTestInstance.mockRejectedValue(
      new Error("DB_ERROR"),
    );

    await expect(
      service.startTest(validUserId, { testConfigId: validConfigId }),
    ).rejects.toThrow();
  });

  it("START-007 Duplicate Active Test", async () => {
    eligibilityService.validateEligibility.mockResolvedValue({
      eligible: false,
      reason: "ACTIVE_TEST_EXISTS",
    });

    await expect(
      service.startTest(validUserId, { testConfigId: validConfigId }),
    ).rejects.toThrow(BadRequestException);
  });
});
