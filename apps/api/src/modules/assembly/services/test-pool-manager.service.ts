import { Injectable, Logger, Inject, Optional, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BlueprintBuilderService } from "./blueprint-builder.service";
import { QuestionAllocatorService } from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { AssemblyValidatorService } from "../validators/assembly-validator.service";
import { PregeneratedTestRepository } from "../repositories/pregenerated-test.repository";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { FinalShufflerService } from "../../tests/start-test/final-shuffler.service";
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
  candidateNoRepeatEnabled?: boolean;
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
    @Optional() @Inject(FinalShufflerService) private readonly finalShuffler?: FinalShufflerService,
  ) {}

  private sanitizeSections(sections: any[]): any[] {
    return (sections || []).map((sec, sIdx) => ({
      sectionKey: sec.sectionKey,
      sectionName: sec.sectionName || sec.displayName || `Section ${sIdx + 1}`,
      durationSeconds: sec.durationSeconds || 600,
      questionCount: sec.questions?.length || sec.questionCount || 0,
      orderIndex: sec.orderIndex ?? sIdx,
      questions: (sec.questions || []).map((q: any, qIdx: number) => ({
        questionId: q.questionId || q.id,
        questionOrder: q.questionOrder ?? qIdx,
        questionSnapshot: q.questionSnapshot || {
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || q.mcqData?.options || [],
          answer: q.answer,
          explanation: q.explanation || "",
          difficulty: q.difficulty || "MEDIUM",
        },
      })),
    }));
  }

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
      // Drop any READY instances baked from a blueprint version that no longer
      // matches the current exam config before counting depth — otherwise an
      // admin's section edit would silently leave stale, unusable rows counted
      // as "ready" capacity while never actually being claimable as fresh work.
      try {
        const blueprint = await this.blueprintBuilder.generateBlueprint(configId);
        if ((blueprint as any).versionHash) {
          await this.pregeneratedRepo.expireStaleInstances(configId, (blueprint as any).versionHash);
        }
      } catch (blueprintErr: any) {
        this.logger.warn(`  [POOL-STATUS ⚠️] Could not check blueprint freshness for ${configId}: ${blueprintErr?.message || blueprintErr}`);
      }

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
      candidateNoRepeatEnabled: ruleFlags?.candidateNoRepeatEnabled ?? false,
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

    const tStart = Date.now();
    this.logger.log(`[POOL-REFILL 🚀] Refilling pool for "${status.configName}": generating ${needed} instances...`);

    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);
    if (!blueprint || !blueprint.sections || blueprint.sections.length === 0) {
      throw new Error(`Cannot refill pool: Blueprint for ${configId} has no sections.`);
    }

    const generatedBatch: Array<{ sectionsJson: any; configVersionHash?: string }> = [];
    const versionHash = (blueprint as any).versionHash || (blueprint as any).id || null;

    // Strategy 1: Fast Permutation from existing Master Assembly if published
    const isCandidateNoRepeat = status.candidateNoRepeatEnabled ?? false;

    const reusableAssembly = !isCandidateNoRepeat
      ? await this.assembledTestRepo.findByConfigId(configId)
      : null;
    const hasValidReusable =
      reusableAssembly &&
      Array.isArray(reusableAssembly.sections) &&
      reusableAssembly.sections.length > 0 &&
      reusableAssembly.sections.every((s: any) => s.questions && s.questions.length > 0);

    if (hasValidReusable && !isCandidateNoRepeat) {
      this.logger.log(`[POOL-REFILL ⚡] Fast Permutation Engine active using Master Assembly (ID: ${reusableAssembly.id}). Synthesizing ${needed} unique variations...`);
      for (let i = 0; i < needed; i++) {
        let instanceSections: any[] = reusableAssembly.sections;
        if (this.finalShuffler) {
          instanceSections = this.finalShuffler.shuffleSections(
            reusableAssembly.sections as any,
            { shuffleQuestionsEnabled: true, shuffleOptionsEnabled: true },
          );
        } else {
          instanceSections = JSON.parse(JSON.stringify(reusableAssembly.sections)).map((sec: any) => {
            sec.questions = (sec.questions || []).sort(() => Math.random() - 0.5);
            sec.questions.forEach((q: any, idx: number) => { q.questionOrder = idx; });
            return sec;
          });
        }

        generatedBatch.push({
          sectionsJson: this.sanitizeSections(instanceSections),
          configVersionHash: versionHash,
        });
      }
    } else {
      // Strategy 2: Pre-fetch Question Candidates in 1 single batch query into an in-memory topic pool
      this.logger.log(`[POOL-REFILL 📦] Pre-fetching Question Bank candidates for ${blueprint.sections.length} sections...`);
      const uniqueTopicIds = new Set<string>();
      for (const sec of blueprint.sections) {
        for (const t of sec.topicAllocations || []) {
          if (t.topicId) uniqueTopicIds.add(t.topicId);
        }
      }

      const allActiveQuestions = await this.prisma.question.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { topicId: { in: Array.from(uniqueTopicIds) } },
            { concept: { topicId: { in: Array.from(uniqueTopicIds) } } },
          ],
        },
        select: {
          id: true,
          topicId: true,
          difficulty: true,
          questionType: true,
          questionText: true,
          answer: true,
          explanation: true,
          metadata: true,
          mcqData: true,
        },
      });

      const questionPoolByTopic = new Map<string, { EASY: any[]; MEDIUM: any[]; HARD: any[]; ALL: any[] }>();
      for (const q of allActiveQuestions) {
        const tId = q.topicId;
        if (!questionPoolByTopic.has(tId)) {
          questionPoolByTopic.set(tId, { EASY: [], MEDIUM: [], HARD: [], ALL: [] });
        }
        const bucket = questionPoolByTopic.get(tId)!;
        bucket.ALL.push(q);
        const diff = (q.difficulty || "MEDIUM").toUpperCase();
        if (diff === "EASY") bucket.EASY.push(q);
        else if (diff === "HARD") bucket.HARD.push(q);
        else bucket.MEDIUM.push(q);
      }

      const hasCoverage = uniqueTopicIds.size > 0 && allActiveQuestions.length >= (blueprint.totalQuestions || 1);

      if (hasCoverage) {
        this.logger.log(`[POOL-REFILL ⚡] In-Memory Synthesis Engine active (${allActiveQuestions.length} pre-fetched questions across ${uniqueTopicIds.size} topics). Generating ${needed} instances...`);
        for (let i = 0; i < needed; i++) {
          const sections: AllocatedSectionDto[] = [];
          let orderCounter = 1;

          for (const bpSection of blueprint.sections) {
            const sectionQuestions: any[] = [];
            for (const topicAlloc of bpSection.topicAllocations || []) {
              const quota = Math.max(1, Math.round((topicAlloc.percentage / 100) * bpSection.questionCount));
              const bucket = questionPoolByTopic.get(topicAlloc.topicId) || { EASY: [], MEDIUM: [], HARD: [], ALL: [] };
              const available = bucket.ALL.length > 0 ? bucket.ALL : allActiveQuestions;

              const shuffled = [...available].sort(() => Math.random() - 0.5);
              const picked = shuffled.slice(0, Math.min(quota, shuffled.length));

              for (const q of picked) {
                const snapshot = {
                  id: q.id,
                  questionText: q.questionText,
                  questionType: q.questionType,
                  options: q.options || (q.mcqData as any)?.options || [],
                  answer: q.answer,
                  explanation: q.explanation || "",
                  difficulty: q.difficulty || "MEDIUM",
                  conceptKey: q.topicId,
                  topicId: q.topicId,
                };
                sectionQuestions.push({
                  questionId: q.id,
                  questionHash: q.id,
                  conceptKey: q.topicId,
                  difficultyLevel: (q.difficulty || "MEDIUM") as any,
                  questionType: (q.questionType || "MULTIPLE_CHOICE") as any,
                  questionOrder: orderCounter++,
                  questionSnapshot: snapshot,
                });
              }
            }

            sections.push({
              sectionKey: bpSection.sectionKey,
              displayName: bpSection.displayName || bpSection.sectionKey,
              durationSeconds: bpSection.durationSeconds,
              questionCount: sectionQuestions.length,
              orderIndex: bpSection.orderIndex,
              questions: sectionQuestions,
            });
          }

          let instanceSections: any[] = sections;
          if (this.finalShuffler) {
            instanceSections = this.finalShuffler.shuffleSections(
              sections as any,
              { shuffleQuestionsEnabled: true, shuffleOptionsEnabled: true },
            );
          } else {
            instanceSections = JSON.parse(JSON.stringify(sections)).map((sec: any) => {
              sec.questions = (sec.questions || []).sort(() => Math.random() - 0.5);
              sec.questions.forEach((q: any, idx: number) => { q.questionOrder = idx; });
              return sec;
            });
          }

          generatedBatch.push({
            sectionsJson: this.sanitizeSections(instanceSections),
            configVersionHash: versionHash,
          });
        }
      } else {
        // Fallback: Generate one base template instance via allocator and synthesize variations
        this.logger.log(`[POOL-REFILL ℹ️] Limited question pool: generating 1 base instance and synthesizing variations...`);
        const sections: AllocatedSectionDto[] = [];
        const allocatedQuestionIds = new Set<string>();

        for (const bpSection of blueprint.sections) {
          const allocatedQuestions = await this.allocator.allocateQuestions(
            bpSection,
            allocatedQuestionIds,
            [],
            { distribution: { EASY: 40, MEDIUM: 40, HARD: 20 } },
            configId,
          );
          sections.push(this.sectionBuilder.buildSection(bpSection, allocatedQuestions));
        }

        for (let i = 0; i < needed; i++) {
          let instanceSections: any[] = sections;
          if (this.finalShuffler) {
            instanceSections = this.finalShuffler.shuffleSections(
              sections as any,
              { shuffleQuestionsEnabled: true, shuffleOptionsEnabled: true },
            );
          } else {
            instanceSections = JSON.parse(JSON.stringify(sections)).map((sec: any) => {
              sec.questions = (sec.questions || []).sort(() => Math.random() - 0.5);
              sec.questions.forEach((q: any, idx: number) => { q.questionOrder = idx; });
              return sec;
            });
          }

          generatedBatch.push({
            sectionsJson: this.sanitizeSections(instanceSections),
            configVersionHash: versionHash,
          });
        }
      }
    }

    // Step 3: Fast concurrent chunked insertion in batches of 20 (avoids parameter overflow and locks)
    const CHUNK_SIZE = 20;
    const chunks: Array<Array<{ sectionsJson: any; configVersionHash?: string }>> = [];
    for (let i = 0; i < generatedBatch.length; i += CHUNK_SIZE) {
      chunks.push(generatedBatch.slice(i, i + CHUNK_SIZE));
    }

    const results = await Promise.all(
      chunks.map((chunk) => this.pregeneratedRepo.createInstancesBatch(configId, chunk)),
    );
    const totalAdded = results.reduce((sum, c) => sum + c, 0);

    const currentDepth = await this.pregeneratedRepo.countReadyInstances(configId);
    const durationMs = Date.now() - tStart;
    this.logger.log(`[POOL-REFILL ✅] Successfully added ${totalAdded} ready instances to pool for "${status.configName}" in ${durationMs}ms! Current depth: ${currentDepth}`);

    return { added: totalAdded, currentDepth };
  }
}
