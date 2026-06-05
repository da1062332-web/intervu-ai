import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { SystemConfigService } from "./system-config.service";
import { ConfigRepository } from "../repositories/config.repository";
import { TemplateRepository } from "../../template-library/repositories/template.repository";
import { RedisCacheService } from "../../../cache";

describe("SystemConfigService", () => {
  let service: SystemConfigService;
  let configRepository: jest.Mocked<ConfigRepository>;
  let templateRepository: jest.Mocked<TemplateRepository>;
  let cacheService: jest.Mocked<RedisCacheService>;

  const mockConfigDto = {
    difficultyLevels: [
      {
        id: "easy",
        name: "Easy",
        timeLimitSeconds: 60,
        weight: 1,
        isActive: true,
        passingScore: 60,
      },
      {
        id: "medium",
        name: "Medium",
        timeLimitSeconds: 120,
        weight: 2,
        isActive: true,
        passingScore: 70,
      },
      {
        id: "hard",
        name: "Hard",
        timeLimitSeconds: 180,
        weight: 3,
        isActive: true,
        passingScore: 80,
      },
    ],
    generationRules: {
      defaultModel: "gpt-4",
      temperature: 0.7,
      maxTokens: 1000,
      temperaturePresets: { easy: 0.5, medium: 0.7, hard: 0.9 },
      retryCount: 3,
    },
    validationRules: {
      strictMode: true,
      maxValidationErrors: 5,
      allowedTypes: ["multiple-choice", "coding", "free-text"],
      allowUnknownFields: false,
    },
    queueSettings: {
      concurrency: { generation: 5, evaluation: 2, analytics: 10 },
      jobTimeoutMs: 30000,
      maxAttempts: 3,
      backoffDelayMs: 5000,
    },
    environmentFlags: {
      maintenanceMode: false,
      enableWorker: true,
      debugMode: false,
      enableCaching: true,
    },
  };

  beforeEach(async () => {
    const mockConfigRepo = {
      findById: jest.fn(),
      upsertConfig: jest.fn(),
    };

    const mockTemplateRepo = {
      findSystemTemplates: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        { provide: ConfigRepository, useValue: mockConfigRepo },
        { provide: TemplateRepository, useValue: mockTemplateRepo },
        { provide: RedisCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    configRepository = module.get(ConfigRepository);
    templateRepository = module.get(TemplateRepository);
    cacheService = module.get(RedisCacheService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getSystemConfig", () => {
    it("should return cached config if cache hit occurs", async () => {
      cacheService.get.mockResolvedValue(mockConfigDto);

      const result = await service.getSystemConfig();

      expect(cacheService.get).toHaveBeenCalledWith("config:system");
      expect(result).toEqual(mockConfigDto);
      expect(configRepository.findById).not.toHaveBeenCalled();
    });

    it("should fetch from repository and populate cache on cache miss", async () => {
      cacheService.get.mockResolvedValue(null);
      configRepository.findById.mockResolvedValueOnce({
        id: "difficulty",
        value: mockConfigDto.difficultyLevels,
      } as never);
      configRepository.findById.mockResolvedValueOnce({
        id: "generation",
        value: mockConfigDto.generationRules,
      } as never);
      configRepository.findById.mockResolvedValueOnce({
        id: "validation",
        value: mockConfigDto.validationRules,
      } as never);
      configRepository.findById.mockResolvedValueOnce({
        id: "queue",
        value: mockConfigDto.queueSettings,
      } as never);
      configRepository.findById.mockResolvedValueOnce({
        id: "envFlags",
        value: mockConfigDto.environmentFlags,
      } as never);

      const result = await service.getSystemConfig();

      expect(configRepository.findById).toHaveBeenCalledTimes(5);
      expect(cacheService.set).toHaveBeenCalledWith(
        "config:system",
        mockConfigDto,
        { ttl: 3600 },
      );
      expect(result).toEqual(mockConfigDto);
    });
  });

  describe("updateSystemConfig", () => {
    it("should throw BadRequestException if update payload is invalid", async () => {
      const invalidPayload = {
        generationRules: {
          temperature: 5.5, // Temperature must be between 0 and 2
        },
      };

      await expect(service.updateSystemConfig(invalidPayload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should successfully merge, upsert and refresh cache for valid payload", async () => {
      // Setup current mock values
      cacheService.get.mockResolvedValue(mockConfigDto);

      const updatePayload = {
        generationRules: {
          defaultModel: "claude-3-opus",
          temperature: 0.8,
        },
      };

      configRepository.upsertConfig.mockResolvedValue({} as never);
      cacheService.set.mockResolvedValue(true);

      const result = await service.updateSystemConfig(updatePayload);

      expect(configRepository.upsertConfig).toHaveBeenCalledWith("generation", {
        ...mockConfigDto.generationRules,
        defaultModel: "claude-3-opus",
        temperature: 0.8,
      });

      expect(cacheService.set).toHaveBeenCalled();
      expect(result.generationRules.defaultModel).toBe("claude-3-opus");
      expect(result.generationRules.temperature).toBe(0.8);
    });
  });

  describe("getTemplates", () => {
    it("should return templates from templateRepository", async () => {
      const mockTemplates = [
        { id: "t1", name: "T1", isSystem: true, config: {} },
      ];
      templateRepository.findSystemTemplates.mockResolvedValue(
        mockTemplates as never,
      );

      const result = await service.getTemplates();

      expect(templateRepository.findSystemTemplates).toHaveBeenCalled();
      expect(result).toEqual(mockTemplates);
    });
  });
});
