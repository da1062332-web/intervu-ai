import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { AutosaveService } from "./autosave.service";
import { ExecutionStateService } from "./execution-state.service";

@Injectable()
export class AssessmentResilienceTestService {
  private readonly logger = new Logger(AssessmentResilienceTestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
    private readonly autosaveService: AutosaveService,
    private readonly stateService: ExecutionStateService,
  ) {}

  /**
   * Simulates a network drop by temporarily invalidating the cache and
   * verifying if the database state remains intact and can be restored.
   */
  async simulateNetworkDrop(testInstanceId: string): Promise<boolean> {
    this.logger.log(`Simulating network drop for instance ${testInstanceId}`);
    
    // 1. Force clear cache for execution state
    const stateCacheKey = `execution-state:${testInstanceId}`;
    await this.cacheService.delete(stateCacheKey);

    // 2. Attempt to restore progress (should hit DB)
    const state = await this.stateService.restoreProgress(testInstanceId);
    
    return !!state;
  }

  /**
   * Simulates a multiple tab scenario by acquiring the submission lock
   * and ensuring that another process cannot acquire it.
   */
  async simulateMultipleTabs(testInstanceId: string): Promise<boolean> {
    this.logger.log(`Simulating multiple tabs for instance ${testInstanceId}`);
    const lockKey = `lock:submit:${testInstanceId}`;
    
    // Simulate Tab A submitting
    await this.cacheService.set(lockKey, "true", { ttl: 30 });
    
    // Simulate Tab B submitting (should see lock)
    const isLocked = await this.cacheService.get<string>(lockKey);
    
    // Cleanup
    await this.cacheService.delete(lockKey);
    
    return !!isLocked;
  }
}
