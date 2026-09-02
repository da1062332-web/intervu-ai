import { Injectable, Logger, Inject, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BlueprintBuilderService } from "./blueprint-builder.service";
import { QuestionAllocatorService } from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { AssemblyValidatorService } from "../validators/assembly-validator.service";
import { PregeneratedTestRepository } from "../repositories/pregenerated-test.repository";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AllocatedSectionDto } from "@intervu/shared";

export interface PoolStatusResponse {
  configId: string;
  configName: string;
  poolEnabled: boolean;
  poolTargetSize: number;
  poolMinThreshold: number;
  poolRefillBatchSize: number;
  readyPoolCount: number;
  claimedPoolCount: number;
  publishedMasterAssembliesCount: number;
  needsRefill: boolean;
}

export interface UpdatePoolConfigDto {
  poolEnabled?: boolean;
  poolTargetSize?: number;
  poolMinThreshold?: number;
  poolRefillBatchSize?: number;
}

@Injectable()
export class TestPoolManagerService {
  private readonly logger = new Logger(TestPoolManagerService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BlueprintBuilderService) private readonly blueprintBuilder: BlueprintBuilderService,
    @Inject(QuestionAllocatorService) private readonly allocator: QuestionAllocatorService,
    @Inject(SectionBuilderService) private readonly sectionBuilder: SectionBuilderService,
    @Inject(AssemblyValidatorService) private readonly validator: AssemblyValidatorService,
    @Inject(PregeneratedTestRepository) private readonly pregeneratedRepo: PregeneratedTestRepository,
    @Inject(AssembledTestRepository) private readonly assembledTestRepo: AssembledTestRepository,
  ) {}

  /**
   * Returns live dynamic pool depth, target size, and health status for an exam configuration.
   */
  async getPoolStatus(configId: string): Promise<PoolStatusResponse> {
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
      include: { ruleFlags: true },
    });

    if (!config) {
      throw new NotFoundException(`Exam configuration ${configId} not found`);
    }

    const ruleFlags = config.ruleFlags as any;
    const poolEnabled = ruleFlags?.poolEnabled ?? false;
    const poolTargetSize = ruleFlags?.poolTargetSize ?? 10;
    const poolMinThreshold = ruleFlags?.poolMinThreshold ?? 3;
    const poolRefillBatchSize = ruleFlags?.poolRefillBatchSize ?? 5;

    let readyPoolCount = 0;
    let claimedPoolCount = 0;

    try {
      readyPoolCount = await (this.prisma as any).pregeneratedTestInstance.count({
        where: { configId, status: "READY" },
      });
      claimedPoolCount = await (this.prisma as any).pregeneratedTestInstance.count({
        where: { configId, status: "CLAIMED" },
      });
    } catch {
      // Table may not have been migrated in older environments
    }

    const publishedMasterAssembliesCount = await this.prisma.assembledTest.count({
      where: { configId, status: "PUBLISHED" },
    });

    const needsRefill = poolEnabled && readyPoolCount < poolMinThreshold;

    return {
      configId,
      configName: config.name,
      poolEnabled,
      poolTargetSize,
      poolMinThreshold,
      poolRefillBatchSize,
      readyPoolCount,
      claimedPoolCount,
      publishedMasterAssembliesCount,
      needsRefill,
    };
  }

  /**
   * Adjusts the dynamic pool capacity (increase/decrease target pool count or thresholds).
   */
  async updatePoolConfig(
    configId: string,
    dto: UpdatePoolConfigDto,
  ): Promise<PoolStatusResponse> {
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(`Exam configuration ${configId} not found`);
    }

    await this.prisma.ruleFlags.upsert({
      where: { examConfigId: configId },
      update: {
        ...(dto.poolEnabled !== undefined && { poolEnabled: dto.poolEnabled }),
        ...(dto.poolTargetSize !== undefined && { poolTargetSize: dto.poolTargetSize }),
        ...(dto.poolMinThreshold !== undefined && { poolMinThreshold: dto.poolMinThreshold }),
        ...(dto.poolRefillBatchSize !== undefined && { poolRefillBatchSize: dto.poolRefillBatchSize }),
      } as any,
      create: {
        examConfigId: configId,
        poolEnabled: dto.poolEnabled ?? false,
        poolTargetSize: dto.poolTargetSize ?? 10,
        poolMinThreshold: dto.poolMinThreshold ?? 3,
        poolRefillBatchSize: dto.poolRefillBatchSize ?? 5,
      } as any,
    });

    this.logger.log(`[POOL-CONFIG ⚙️] Updated pool configuration for "${config.name}" (TargetSize: ${dto.poolTargetSize ?? 'unchanged'}, Enabled: ${dto.poolEnabled ?? 'unchanged'})`);

    return this.getPoolStatus(configId);
  }

  /**
   * Refills the pre-generated pool for an exam config up to the target size or specified count.
   */
  async refillPool(configId: string, count?: number): Promise<{ added: number; currentDepth: number }> {
    const status = await this.getPoolStatus(configId);
    const needed = count !== undefined ? count : Math.max(0, status.poolTargetSize - status.readyPoolCount);

    if (needed <= 0) {
      this.logger.log(`[POOL-REFILL ℹ️] Pool for "${status.configName}" is already at capacity (${status.readyPoolCount}/${status.poolTargetSize}).`);
      return { added: 0, currentDepth: status.readyPoolCount };
    }

    this.logger.log(`[POOL-REFILL 🚀] Refilling pool for "${status.configName}": generating ${needed} instances...`);

    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);
    if (!blueprint || !blueprint.sections || blueprint.sections.length === 0) {
      throw new Error(`Cannot refill pool: Blueprint for ${configId} has no sections.`);
    }

    const generatedBatch: Array<{ sectionsJson: any; configVersionHash?: string }> = [];

    for (let i = 0; i < needed; i++) {
      try {
        const sections: AllocatedSectionDto[] = [];
        const allocatedQuestionIds = new Set<string>();

        for (const bpSection of blueprint.sections) {
          const allocatedQuestions = await this.allocator.allocateQuestions(
            bpSection,
            allocatedQuestionIds,
            [],
            {
              distribution: {
                EASY: 40,
                MEDIUM: 40,
                HARD: 20,
              },
            },
            configId,
          );
          const section = this.sectionBuilder.buildSection(
            bpSection,
            allocatedQuestions,
          );
          sections.push(section);
        }

        const validation = this.validator.validate(blueprint, sections);
        if (!validation.valid) {
          this.logger.warn(`[POOL-REFILL ⚠️] Discarded instance during refill due to validation errors: ${validation.errors.join(", ")}`);
          continue;
        }

        generatedBatch.push({
          sectionsJson: sections,
          configVersionHash: (blueprint as any).versionHash || (blueprint as any).id || null,
        });
      } catch (err: any) {
        this.logger.error(`[POOL-REFILL ❌] Failed generating pool instance ${i + 1}/${needed}: ${err?.message || err}`);
      }
    }

    const added = await this.pregeneratedRepo.createInstancesBatch(configId, generatedBatch);
    const currentDepth = await this.pregeneratedRepo.countReadyInstances(configId);

    this.logger.log(`[POOL-REFILL ✅] Successfully added ${added} ready instances to pool for "${status.configName}". Current depth: ${currentDepth}`);

    return { added, currentDepth };
  }
}
