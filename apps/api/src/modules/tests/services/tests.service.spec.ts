import { Test, TestingModule } from "@nestjs/testing";
import { TestsService } from "./tests.service";
import { TestsRepository } from "../repositories/tests.repository";
import type { Template } from "@prisma/client";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const buildTemplate = (overrides: Partial<Template> = {}): Template => ({
  id: "template-001",
  name: "Senior Frontend Engineer Interview",
  description: "Frontend engineering assessment",
  difficulty: "MEDIUM",
  config: {
    company: "Acme Corp",
    durationSeconds: 3600,
    sections: ["HTML & CSS", "JavaScript", "React"],
  },
  isSystem: true,
  creatorId: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  deletedAt: null,
  ...overrides,
});

// ─── Mock Repository ──────────────────────────────────────────────────────────

const mockRepository = () => ({
  findAllActiveTemplates: jest.fn(),
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
    repository.findAllActiveTemplates.mockResolvedValue([]);

    const result = await service.getAvailableConfigs();

    expect(result).toEqual({ configs: [] });
    expect(repository.findAllActiveTemplates).toHaveBeenCalledTimes(1);
  });

  it("maps templates to AvailableConfigDto with all populated config fields", async () => {
    repository.findAllActiveTemplates.mockResolvedValue([buildTemplate()]);

    const result = await service.getAvailableConfigs();

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0]).toEqual({
      configId: "template-001",
      company: "Acme Corp",
      name: "Senior Frontend Engineer Interview",
      difficulty: "MEDIUM",
      duration: 3600,
      sections: ["HTML & CSS", "JavaScript", "React"],
    });
  });

  it("defaults duration to 0 when Template.config.durationSeconds is absent", async () => {
    const template = buildTemplate({ config: { company: "Acme" } });
    repository.findAllActiveTemplates.mockResolvedValue([template]);

    const result = await service.getAvailableConfigs();

    expect(result.configs[0].duration).toBe(0);
  });

  it("defaults sections to [] when Template.config.sections is absent", async () => {
    const template = buildTemplate({ config: { durationSeconds: 1800 } });
    repository.findAllActiveTemplates.mockResolvedValue([template]);

    const result = await service.getAvailableConfigs();

    expect(result.configs[0].sections).toEqual([]);
  });

  it("defaults company to '' when Template.config.company is absent", async () => {
    const template = buildTemplate({
      config: { durationSeconds: 1800, sections: [] },
    });
    repository.findAllActiveTemplates.mockResolvedValue([template]);

    const result = await service.getAvailableConfigs();

    expect(result.configs[0].company).toBe("");
  });

  it("handles multiple templates and preserves order from repository", async () => {
    const t1 = buildTemplate({ id: "t-001", name: "Test A" });
    const t2 = buildTemplate({ id: "t-002", name: "Test B" });
    repository.findAllActiveTemplates.mockResolvedValue([t1, t2]);

    const result = await service.getAvailableConfigs();

    expect(result.configs).toHaveLength(2);
    expect(result.configs[0].configId).toBe("t-001");
    expect(result.configs[1].configId).toBe("t-002");
  });

  it("maps difficulty enum value as a string without transformation", async () => {
    const template = buildTemplate({ difficulty: "HARD" });
    repository.findAllActiveTemplates.mockResolvedValue([template]);

    const result = await service.getAvailableConfigs();

    expect(result.configs[0].difficulty).toBe("HARD");
  });
});
