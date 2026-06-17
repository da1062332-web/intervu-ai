import { Test, TestingModule } from "@nestjs/testing";
import { RuleFlagsService } from "../services/rule-flags.service";
import { RuleFlagsRepository } from "../repositories/rule-flags.repository";
import { ConfigNotFoundError, RuleCombinationError } from "@intervu/shared";

describe("RuleFlagsService", () => {
  let service: RuleFlagsService;
  let repository: jest.Mocked<RuleFlagsRepository>;

  const mockRepository = {
    checkConfigExists: jest.fn(),
    findByConfigId: jest.fn(),
    upsert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleFlagsService,
        { provide: RuleFlagsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<RuleFlagsService>(RuleFlagsService);
    repository = module.get(RuleFlagsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRuleFlags", () => {
    it("should throw ConfigNotFoundError if config does not exist", async () => {
      repository.checkConfigExists.mockResolvedValue(false);
      await expect(service.getRuleFlags("config-1")).rejects.toThrow(
        ConfigNotFoundError,
      );
    });

    it("should return defaults if rule flags are not found", async () => {
      repository.checkConfigExists.mockResolvedValue(true);
      repository.findByConfigId.mockResolvedValue(null);

      const result = await service.getRuleFlags("config-1");

      expect(result.examConfigId).toBe("config-1");
      expect(result.freeNavigationEnabled).toBe(true);
      expect(result.sectionLockingEnabled).toBe(false);
    });

    it("should return found rule flags", async () => {
      repository.checkConfigExists.mockResolvedValue(true);
      const mockFlags = {
        id: "1",
        examConfigId: "config-1",
        freeNavigationEnabled: false,
        sectionLockingEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as import("@prisma/client").ExamRuleFlags;
      repository.findByConfigId.mockResolvedValue(mockFlags);

      const result = await service.getRuleFlags("config-1");

      expect(result.freeNavigationEnabled).toBe(false);
      expect(result.sectionLockingEnabled).toBe(true);
    });
  });

  describe("updateRuleFlags", () => {
    it("should throw ConfigNotFoundError if config does not exist", async () => {
      repository.checkConfigExists.mockResolvedValue(false);
      await expect(
        service.updateRuleFlags(
          "config-1",
          {} as unknown as import("@intervu/shared").UpdateRuleFlags,
        ),
      ).rejects.toThrow(ConfigNotFoundError);
    });

    it("should enforce business rules and override freeNavigationEnabled", async () => {
      repository.checkConfigExists.mockResolvedValue(true);
      const input = {
        sectionLockingEnabled: true,
        freeNavigationEnabled: true,
      };

      await expect(
        service.updateRuleFlags(
          "config-1",
          input as unknown as import("@intervu/shared").UpdateRuleFlags,
        ),
      ).rejects.toThrow(RuleCombinationError);
    });

    it("should upsert rule flags successfully", async () => {
      repository.checkConfigExists.mockResolvedValue(true);
      const input = {
        sectionLockingEnabled: true,
        freeNavigationEnabled: false,
      };

      const mockUpdated = {
        ...input,
        id: "1",
        examConfigId: "config-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as import("@prisma/client").ExamRuleFlags;
      repository.upsert.mockResolvedValue(mockUpdated);

      const result = await service.updateRuleFlags(
        "config-1",
        input as unknown as import("@intervu/shared").UpdateRuleFlags,
      );

      expect(repository.upsert).toHaveBeenCalledWith("config-1", input);
      expect(result.id).toBe("1");
    });
  });
});
