import { Test, TestingModule } from "@nestjs/testing";
import { TestsService } from "./tests.service";
import { TestsRepository } from "../repositories/tests.repository";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const buildConfig = (overrides: any = {}) => ({
  id: "config-001",
  companyName: "Acme Corp",
  displayName: "Senior Frontend Engineer Interview",
  totalDurationSeconds: 3600,
  sections: [
    { displayName: "HTML & CSS" },
    { displayName: "JavaScript" },
    { displayName: "React" },
  ],
  ...overrides,
});

// ─── Mock Repository ──────────────────────────────────────────────────────────

const mockRepository = () => ({
  findAllActiveConfigs: jest.fn(),
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("TestsService — getAvailableConfigs", () => {
  let service: TestsService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    repository = mockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestsService,
        { provide: TestsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<TestsService>(TestsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("returns { configs: [] } when repository returns an empty array", async () => {
    repository.findAllActiveConfigs.mockResolvedValue([]);

    const result = await service.getAvailableConfigs();

    expect(result).toEqual({ configs: [] });
    expect(repository.findAllActiveConfigs).toHaveBeenCalledTimes(1);
  });

  it("maps configs to AvailableConfigDto with all populated config fields", async () => {
    repository.findAllActiveConfigs.mockResolvedValue([buildConfig()]);

    const result = await service.getAvailableConfigs();

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0]).toEqual({
      configId: "config-001",
      company: "Acme Corp",
      name: "Senior Frontend Engineer Interview",
      difficulty: "MEDIUM",
      duration: 3600,
      sections: ["HTML & CSS", "JavaScript", "React"],
    });
  });

  it("handles multiple configs and preserves order from repository", async () => {
    const c1 = buildConfig({ id: "config-001", displayName: "Test A" });
    const c2 = buildConfig({ id: "config-002", displayName: "Test B" });
    repository.findAllActiveConfigs.mockResolvedValue([c1, c2]);

    const result = await service.getAvailableConfigs();

    expect(result.configs).toHaveLength(2);
    expect(result.configs[0].configId).toBe("config-001");
    expect(result.configs[1].configId).toBe("config-002");
  });
});
