import { Test, TestingModule } from "@nestjs/testing";
import { TestsController } from "@/modules/tests/controllers/tests.controller";
import { TestsService } from "@/modules/tests/services/tests.service";
import type {
  TestConfigsResponseDto,
  AvailableConfigDto,
} from "@/modules/tests/dto/available-config.dto";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CONFIGS_RESPONSE: TestConfigsResponseDto = {
  configs: [
    {
      configId: "template-001",
      company: "Acme Corp",
      name: "Senior Frontend Interview",
      difficulty: "MEDIUM",
      duration: 3600,
      sections: ["HTML & CSS", "JavaScript", "React"],
    },
    {
      configId: "template-002",
      company: "",
      name: "Backend Systems Design",
      difficulty: "HARD",
      duration: 5400,
      sections: ["System Design", "Databases"],
    },
  ],
};

// ─── Mock Service ─────────────────────────────────────────────────────────────

const mockTestsService = {
  getAvailableConfigs: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("TestsController Integration — getAvailableConfigs", () => {
  let controller: TestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestsController],
      providers: [{ provide: TestsService, useValue: mockTestsService }],
    }).compile();

    controller = module.get<TestsController>(TestsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ─── Response shape ────────────────────────────────────────────────────────

  it("returns the full configs response from the service", async () => {
    mockTestsService.getAvailableConfigs.mockResolvedValue(
      MOCK_CONFIGS_RESPONSE,
    );

    const result = await controller.getAvailableConfigs();

    expect(result).toEqual(MOCK_CONFIGS_RESPONSE);
  });

  it("response contains a configs array", async () => {
    mockTestsService.getAvailableConfigs.mockResolvedValue(
      MOCK_CONFIGS_RESPONSE,
    );

    const result = await controller.getAvailableConfigs();

    expect(Array.isArray(result.configs)).toBe(true);
  });

  // ─── Config field validation ───────────────────────────────────────────────

  it("each config contains all required contract fields", async () => {
    mockTestsService.getAvailableConfigs.mockResolvedValue(
      MOCK_CONFIGS_RESPONSE,
    );

    const result = await controller.getAvailableConfigs();

    result.configs.forEach((config: AvailableConfigDto) => {
      expect(config).toHaveProperty("configId");
      expect(config).toHaveProperty("company");
      expect(config).toHaveProperty("name");
      expect(config).toHaveProperty("difficulty");
      expect(config).toHaveProperty("duration");
      expect(config).toHaveProperty("sections");
      expect(Array.isArray(config.sections)).toBe(true);
    });
  });

  // ─── Service delegation ────────────────────────────────────────────────────

  it("calls getAvailableConfigs exactly once", async () => {
    mockTestsService.getAvailableConfigs.mockResolvedValue(
      MOCK_CONFIGS_RESPONSE,
    );

    await controller.getAvailableConfigs();

    expect(mockTestsService.getAvailableConfigs).toHaveBeenCalledTimes(1);
  });

  it("does not pass any arguments to the service — no request input", async () => {
    mockTestsService.getAvailableConfigs.mockResolvedValue(
      MOCK_CONFIGS_RESPONSE,
    );

    await controller.getAvailableConfigs();

    expect(mockTestsService.getAvailableConfigs).toHaveBeenCalledWith();
  });

  // ─── Empty state ───────────────────────────────────────────────────────────

  it("returns empty configs array when service returns no templates", async () => {
    mockTestsService.getAvailableConfigs.mockResolvedValue({ configs: [] });

    const result = await controller.getAvailableConfigs();

    expect(result.configs).toHaveLength(0);
  });

  // ─── Error propagation ─────────────────────────────────────────────────────

  it("propagates errors from the service without swallowing them", async () => {
    const serviceError = new Error("Repository unavailable");
    mockTestsService.getAvailableConfigs.mockRejectedValue(serviceError);

    await expect(controller.getAvailableConfigs()).rejects.toThrow(
      "Repository unavailable",
    );
  });
});
