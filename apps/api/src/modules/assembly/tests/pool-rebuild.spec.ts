import { PregeneratedTestRepository } from "../repositories/pregenerated-test.repository";
import { TestPoolManagerService } from "../services/test-pool-manager.service";
import { AssemblyController } from "../controllers/assembly.controller";

describe("Pool Rebuild Feature Suite", () => {
  describe("PregeneratedTestRepository.purgeUnclaimedInstances", () => {
    let repo: PregeneratedTestRepository;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        pregeneratedTestInstance: {
          deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
        },
      };
      repo = new PregeneratedTestRepository(mockPrisma as any);
    });

    it("should delete only READY and EXPIRED instances for the specified configId", async () => {
      const deletedCount = await repo.purgeUnclaimedInstances("cfg-123");

      expect(mockPrisma.pregeneratedTestInstance.deleteMany).toHaveBeenCalledWith({
        where: {
          configId: "cfg-123",
          status: { in: ["READY", "EXPIRED"] },
        },
      });
      expect(deletedCount).toBe(5);
    });

    it("should handle error gracefully and return 0", async () => {
      mockPrisma.pregeneratedTestInstance.deleteMany.mockRejectedValue(new Error("DB error"));

      const deletedCount = await repo.purgeUnclaimedInstances("cfg-123");

      expect(deletedCount).toBe(0);
    });
  });

  describe("TestPoolManagerService.rebuildPool", () => {
    let service: TestPoolManagerService;
    let mockPrisma: any;
    let mockBlueprintBuilder: any;
    let mockAllocator: any;
    let mockSectionBuilder: any;
    let mockValidator: any;
    let mockPregeneratedRepo: any;
    let mockAssembledTestRepo: any;

    beforeEach(() => {
      mockPrisma = {
        examConfig: {
          findUnique: jest.fn().mockResolvedValue({
            id: "cfg-123",
            name: "Test Config",
            ruleFlags: {
              poolEnabled: true,
              poolTargetSize: 10,
              poolMinThreshold: 3,
              poolRefillBatchSize: 5,
            },
          }),
        },
        assembledTest: { count: jest.fn().mockResolvedValue(1) },
      };
      mockBlueprintBuilder = {
        generateBlueprint: jest.fn().mockResolvedValue({
          id: "bp-1",
          versionHash: "new-hash-v2",
          totalQuestions: 10,
          sections: [
            {
              sectionKey: "sec1",
              questionCount: 10,
              durationSeconds: 600,
              topicAllocations: [],
            },
          ],
        }),
      };
      mockAllocator = { allocateQuestions: jest.fn() };
      mockSectionBuilder = { buildSection: jest.fn() };
      mockValidator = { validate: jest.fn() };
      mockPregeneratedRepo = {
        purgeUnclaimedInstances: jest.fn().mockResolvedValue(4),
        expireStaleInstances: jest.fn().mockResolvedValue(0),
        countReadyInstances: jest.fn().mockResolvedValue(10),
        createInstancesBatch: jest.fn().mockResolvedValue(10),
      };
      mockAssembledTestRepo = {
        findByConfigId: jest.fn().mockResolvedValue(null),
      };

      service = new TestPoolManagerService(
        mockPrisma as any,
        mockBlueprintBuilder as any,
        mockAllocator as any,
        mockSectionBuilder as any,
        mockValidator as any,
        mockPregeneratedRepo as any,
        mockAssembledTestRepo as any,
      );
    });

    it("should purge stale unclaimed instances and refill fresh pool instances", async () => {
      const refillSpy = jest.spyOn(service, "refillPool").mockResolvedValue({
        added: 10,
        currentDepth: 10,
      });

      const result = await service.rebuildPool("cfg-123");

      expect(mockPregeneratedRepo.purgeUnclaimedInstances).toHaveBeenCalledWith("cfg-123");
      expect(refillSpy).toHaveBeenCalledWith("cfg-123");
      expect(result).toEqual({
        deleted: 4,
        added: 10,
        currentDepth: 10,
      });
    });
  });

  describe("AssemblyController.rebuildPool endpoint", () => {
    let controller: AssemblyController;
    let mockPoolManager: any;

    beforeEach(() => {
      mockPoolManager = {
        rebuildPool: jest.fn().mockResolvedValue({
          deleted: 3,
          added: 10,
          currentDepth: 10,
        }),
      };

      controller = new AssemblyController(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockPoolManager as any,
      );
    });

    it("should call poolManagerService.rebuildPool and return response format", async () => {
      const response = await controller.rebuildPool("cfg-123");

      expect(mockPoolManager.rebuildPool).toHaveBeenCalledWith("cfg-123");
      expect(response).toEqual({
        success: true,
        data: {
          deleted: 3,
          added: 10,
          currentDepth: 10,
        },
        error: null,
        meta: null,
      });
    });
  });
});
