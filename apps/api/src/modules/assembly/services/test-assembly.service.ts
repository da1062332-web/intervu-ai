import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Inject,
  Optional,
} from "@nestjs/common";

import { AssemblyPersistenceService } from "./assembly-persistence.service";
import { BlueprintBuilderService } from "./blueprint-builder.service";
import {
  QuestionAllocatorService,
  AllocationConfig,
} from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { AssemblyValidatorService } from "../validators/assembly-validator.service";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { ProgressiveAssemblyWorkerService } from "./progressive-assembly-worker.service";
import { PregeneratedTestRepository } from "../repositories/pregenerated-test.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { GeneratedQuestion } from "@prisma/client";
import { PreloadedTopicPool } from "./question-allocator.service";

@Injectable()
export class AssemblyService {
  private readonly logger = new Logger(AssemblyService.name);
  private readonly DEFAULT_ALLOCATION_CONFIG: AllocationConfig = {
    distribution: {
      EASY: 40,
      MEDIUM: 40,
      HARD: 20,
    },
  };
  constructor(
    @Inject(AssemblyPersistenceService)
    private readonly persistenceService: AssemblyPersistenceService,
    @Inject(BlueprintBuilderService)
    private readonly blueprintBuilder: BlueprintBuilderService,
    @Inject(QuestionAllocatorService)
    private readonly allocator: QuestionAllocatorService,
    @Inject(SectionBuilderService)
    private readonly sectionBuilder: SectionBuilderService,
    @Inject(AssemblyValidatorService)
    private readonly validator: AssemblyValidatorService,
    @Inject(QuestionPoolRepository)
    private readonly poolRepository: QuestionPoolRepository,
    @Inject(AssembledTestRepository)
    private readonly assembledTestRepository: AssembledTestRepository,
    @Optional()
    @Inject(ProgressiveAssemblyWorkerService)
    private readonly progressiveWorker?: ProgressiveAssemblyWorkerService,
    @Optional()
    @Inject(PregeneratedTestRepository)
    private readonly pregeneratedRepo?: PregeneratedTestRepository,
    @Optional()
    @Inject(PrismaService)
    private readonly prisma?: PrismaService,
  ) {}

  private mapDbQuestionToGenerated(q: any): GeneratedQuestion {
    const isCoding =
      (q as any).questionType === "CODING" ||
      Boolean(q.codingData) ||
      (q.questionText || "").startsWith("### Problem Statement");
    const questionType = isCoding
      ? "CODING"
      : (q as any).questionType || "MULTIPLE_CHOICE";
    const rawOptions = isCoding
      ? []
      : q.mcqData?.options ||
        q.options ||
        (q as any).metadata?.options ||
        (q as any).choices ||
        [];

    return {
      id: q.id,
      conceptKey: q.topicId,
      difficultyLevel: (q.difficulty || "MEDIUM") as GeneratedQuestion["difficultyLevel"],
      questionType: questionType as any,
      questionText: q.questionText,
      questionHash: q.id,
      metadata: {
        answer: q.answer,
        explanation: q.explanation,
        sectionId: q.sectionId,
        source: "QUESTION_BANK",
      } as unknown as GeneratedQuestion["metadata"],
      templateId: q.templateId || (null as unknown as string),
      options: rawOptions as unknown as GeneratedQuestion["options"],
      mcqData: q.mcqData,
      codingData: q.codingData,
      correctAnswer: q.answer as unknown as GeneratedQuestion["correctAnswer"],
      solution: q.explanation as unknown as GeneratedQuestion["solution"],
      expectedAnswer: null as unknown as string,
      questionStatement: q.questionStatement as unknown as string,
      instructions: q.instructions as unknown as string,
      createdAt: q.createdAt || new Date(),
      updatedAt: q.updatedAt || new Date(),
    } as GeneratedQuestion;
  }

  private async buildPreloadedPool(blueprint: any): Promise<PreloadedTopicPool | undefined> {
    if (!this.prisma) return undefined;

    const tStart = Date.now();
    const topicIdSet = new Set<string>();
    for (const sec of blueprint.sections || []) {
      for (const t of sec.topicAllocations || []) {
        if (t.topicId) topicIdSet.add(t.topicId);
      }
    }

    if (topicIdSet.size === 0) return undefined;

    const allTopicIds = Array.from(topicIdSet);
    this.logger.log(`  [ASSEMBLY 📦] Pre-fetching question pool for ${allTopicIds.length} topics in 1 batch query...`);

    const dbQuestions = await this.prisma.question.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { topicId: { in: allTopicIds } },
          { concept: { topicId: { in: allTopicIds } } },
        ],
      },
      orderBy: [
        { timesUsed: "asc" },
        { lastUsed: "asc" },
        { createdAt: "asc" },
      ],
    });

    const pool: PreloadedTopicPool = new Map();
    for (const q of dbQuestions) {
      const gq = this.mapDbQuestionToGenerated(q);
      const tId = q.topicId;
      if (!pool.has(tId)) {
        pool.set(tId, { EASY: [], MEDIUM: [], HARD: [], ALL: [] });
      }
      const bucket = pool.get(tId)!;
      bucket.ALL.push(gq);
      const diff = (gq.difficultyLevel || "MEDIUM").toUpperCase();
      if (diff === "EASY") bucket.EASY.push(gq);
      else if (diff === "HARD") bucket.HARD.push(gq);
      else bucket.MEDIUM.push(gq);
    }

    this.poolRepository.seedQuestions(dbQuestions);
    this.logger.log(`  [ASSEMBLY ⚡📦] Pre-fetched ${dbQuestions.length} active questions across ${pool.size} topics in ${Date.now() - tStart}ms!`);
    return pool;
  }

  async assembleTest(
    configId: string,
    userId: string = "system-user",
    forceNew: boolean = false,
    options?: { progressive?: boolean; isRetest?: boolean },
  ): Promise<string> {
    if (!configId) throw new BadRequestException("configId is required");

    // Flow 0: Atomic Pre-Generated Pool Claim (< 10ms claim, < 25ms materialize)
    // Only attempted when this exam config has explicitly enabled the pool feature —
    // otherwise every test start would pay for a claim query against a pool that
    // is never populated for this config (pregenerated_test_instances is keyed by
    // ExamConfig, so this is a no-op for TestConfig-based assemblies too).
    if (!forceNew && this.pregeneratedRepo && this.prisma) {
      try {
        const ruleFlags = await this.prisma.ruleFlags.findUnique({
          where: { examConfigId: configId },
          select: { poolEnabled: true },
        });

        if (ruleFlags?.poolEnabled) {
          // Pool instances are baked ahead of time from a specific blueprint
          // version; only accept one that still matches the config's current
          // sections/topic weightage, or a candidate could silently receive a
          // stale question set from before an admin's last edit.
          const currentBlueprint = await this.blueprintBuilder.generateBlueprint(configId);
          const claimed = await this.pregeneratedRepo.claimAtomicInstance(
            configId,
            userId,
            (currentBlueprint as any)?.versionHash ?? null,
          );
          if (claimed) {
            const tClaim = Date.now();
            const instanceId = await this.persistenceService.materializePregeneratedInstanceForCandidate(
              claimed,
              userId,
            );
            this.logger.log(`  [ASSEMBLY ⚡🚀] FLOW 0 (PRE-GEN POOL) COMPLETE in ${Date.now() - tClaim}ms -> Instance: ${instanceId}`);
            return instanceId;
          }
        }
      } catch (poolErr: any) {
        this.logger.warn(`  [ASSEMBLY ⚠️] Pre-generated pool claim failed (${poolErr?.message || poolErr}). Falling back to standard flows.`);
      }
    }

    const tStart = Date.now();
    this.logger.log(`  [ASSEMBLY ⏱️] Step A: Querying published reusable assembly for configId: ${configId}...`);
    const reusableAssembly = await this.assembledTestRepository.findLatestReusableByConfigId(configId);
    const isCandidateNoRepeat = (reusableAssembly as any)?.examConfig?.ruleFlags?.candidateNoRepeatEnabled ?? false;
    this.logger.log(`  [ASSEMBLY ✅] Step A: Found reusable assembly in ${Date.now() - tStart}ms -> AssemblyId: ${reusableAssembly ? reusableAssembly.id : 'NONE'}, candidateNoRepeat: ${isCandidateNoRepeat}`);

    // Flow 1: Standard Exam — instantly clone the pre-assembled PUBLISHED questions (< 50ms).
    // Only skipped when forceNew=true or admin has enabled candidateNoRepeat AI rule.
    if (!forceNew && reusableAssembly && !isCandidateNoRepeat) {
      this.logger.log(`  [ASSEMBLY ⚡] FLOW 1 ACTIVE: Standard Exam with pre-assembled questions. Cloning assembly ${reusableAssembly.id}...`);
      try {
        const tClone = Date.now();
        const instanceId = await this.persistenceService.cloneReusableAssemblyForCandidate(
          reusableAssembly.id,
          configId,
          userId,
        );
        this.logger.log(`  [ASSEMBLY ⚡✅] FLOW 1 CLONE COMPLETE in ${Date.now() - tClone}ms -> Candidate Instance: ${instanceId}`);
        return instanceId;
      } catch (cloneErr) {
        // If clone unexpectedly fails (e.g. race condition), log a warning and
        // fall through to blueprint-based assembly below — never silently invoke AI.
        this.logger.warn(
          `  [ASSEMBLY ⚠️] Clone of reusable assembly ${reusableAssembly.id} failed — ` +
          `falling back to full blueprint assembly. Reason: ${
            cloneErr instanceof Error ? cloneErr.message : String(cloneErr)
          }`,
        );
      }
    }

    const tBp = Date.now();
    this.logger.log(`  [ASSEMBLY ⏱️] Step B: Generating blueprint for configId: ${configId}...`);
    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);
    this.logger.log(`  [ASSEMBLY ✅] Step B: Blueprint generated in ${Date.now() - tBp}ms (Sections: ${blueprint.sections?.length}, TotalQuestions: ${blueprint.totalQuestions})`);

    // Pre-Assembly Hard Gate: Validate blueprint & config readiness before question allocation
    if (!blueprint || !blueprint.sections || blueprint.sections.length === 0) {
      throw new BadRequestException({
        code: "PRE_ASSEMBLY_READINESS_FAILED",
        message:
          "Pre-assembly readiness check failed: Exam configuration has no sections defined.",
      });
    }

    if ((blueprint.totalQuestions ?? 0) <= 0) {
      throw new BadRequestException({
        code: "PRE_ASSEMBLY_READINESS_FAILED",
        message:
          "Pre-assembly readiness check failed: Exam configuration total question count must be greater than 0.",
      });
    }

    const preloadedPool = await this.buildPreloadedPool(blueprint);

    const sections: SectionDto[] = [];
    const allocatedQuestionIds = new Set<string>();

    const tHist = Date.now();
    const historyIds =
      await this.poolRepository.findRecentUsedQuestions(userId);
    this.logger.log(`  [ASSEMBLY ⏱️] Step C: Fetched ${historyIds.length} recent question history IDs in ${Date.now() - tHist}ms`);

    const isRetestOrProgressive =
      options?.progressive === true || options?.isRetest === true;

    if (isRetestOrProgressive && this.progressiveWorker) {
      // --- Progressive Retest Mode ---
      // 1. Allocate & build Section 1 (index 0) synchronously for instant candidate test start (< 0.4s)
      const tSec1 = Date.now();
      const sec1Blueprint = blueprint.sections[0];
      const sec1Questions = await this.allocator.allocateQuestions(
        sec1Blueprint,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
        preloadedPool,
      );
      const sec1 = this.sectionBuilder.buildSection(sec1Blueprint, sec1Questions);
      sections.push(sec1);
      this.logger.log(`  [ASSEMBLY ⏱️] Step D (Progressive): Section 1 allocated & built in ${Date.now() - tSec1}ms (${sec1Questions.length} questions)`);

      // Validate Section 1 synchronously before persisting
      const sec1Validation = this.validator.validate(
        {
          ...blueprint,
          totalQuestions: sec1Blueprint.questionCount,
          totalDurationSeconds: sec1Blueprint.durationSeconds,
          sections: [sec1Blueprint],
        },
        [sec1],
      );
      if (!sec1Validation.valid) {
        this.logger.error(`Section 1 progressive validation failed: ${sec1Validation.errors.join("; ")}`);
        throw new BadRequestException({
          code: "PROGRESSIVE_SECTION_VALIDATION_FAILED",
          message: `Section 1 progressive validation failed: ${sec1Validation.errors.join("; ")}`,
          errors: sec1Validation.errors,
        });
      }

      // 2. Add placeholder section wrappers for remaining sections
      for (let i = 1; i < blueprint.sections.length; i++) {
        const remainingBpSec = blueprint.sections[i];
        sections.push({
          sectionKey: remainingBpSec.sectionKey,
          displayName: remainingBpSec.displayName,
          durationSeconds: remainingBpSec.durationSeconds,
          questionCount: remainingBpSec.questionCount,
          orderIndex: remainingBpSec.orderIndex,
          questions: [],
        });
      }

      // 3. Save initial test instance with Section 1 ready
      const tSave = Date.now();
      const testInstanceId = await this.persistenceService.saveAssembly(
        configId,
        sections,
        userId,
      );
      this.logger.log(`  [ASSEMBLY ⏱️] Step E (Progressive): Saved initial assembly in DB in ${Date.now() - tSave}ms -> Instance ID: ${testInstanceId}`);

      // 4. Kick off background worker to populate Sections 2..N asynchronously
      const remainingBpSections = blueprint.sections.slice(1);
      setImmediate(() => {
        this.progressiveWorker!
          .populateRemainingSections(
            testInstanceId,
            configId,
            userId,
            remainingBpSections,
            allocatedQuestionIds,
            historyIds,
          )
          .catch((err) =>
            console.error("Progressive section background worker error:", err),
          );
      });

      return testInstanceId;
    }

    // --- Standard Full Assembly Mode ---
    this.logger.log(`  [ASSEMBLY ⏱️] Step D: Allocating questions across ${blueprint.sections.length} section(s)...`);
    const tAllSec = Date.now();
    for (let sIdx = 0; sIdx < blueprint.sections.length; sIdx++) {
      const blueprintSection = blueprint.sections[sIdx];
      const tSec = Date.now();
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
        preloadedPool,
      );

      const section = this.sectionBuilder.buildSection(
        blueprintSection,
        allocatedQuestions,
      );
      sections.push(section);
      this.logger.log(`    [SECTION ⏱️ ${sIdx + 1}/${blueprint.sections.length}] "${blueprintSection.displayName || blueprintSection.sectionKey}" allocated ${allocatedQuestions.length} questions in ${Date.now() - tSec}ms`);
    }
    this.logger.log(`  [ASSEMBLY ✅] Step D: All sections allocated in ${Date.now() - tAllSec}ms (Total allocated questions: ${allocatedQuestionIds.size})`);

    const tVal = Date.now();
    const validation = this.validator.validate(blueprint, sections);
    if (!validation.valid) {
      throw new BadRequestException({
        code: "ASSEMBLY_VALIDATION_FAILED",
        message: `Assembly validation failed: ${validation.errors.join(", ")}`,
        errors: validation.errors,
      });
    }
    this.logger.log(`  [ASSEMBLY ✅] Step E: Assembly validation passed in ${Date.now() - tVal}ms`);

    const tPersist = Date.now();
    const testInstanceId = await this.persistenceService.saveAssembly(
      configId,
      sections,
      userId,
    );
    this.logger.log(`  [ASSEMBLY ✅] Step F: Assembly saved to DB in ${Date.now() - tPersist}ms -> Instance: ${testInstanceId}`);

    return testInstanceId;
  }

  async previewTest(configId: string, userId: string = "system-user") {
    if (!configId) throw new BadRequestException("configId is required");

    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);

    // Pre-Assembly Hard Gate: Validate blueprint & config readiness before question allocation
    if (!blueprint || !blueprint.sections || blueprint.sections.length === 0) {
      throw new BadRequestException({
        code: "PRE_ASSEMBLY_READINESS_FAILED",
        message:
          "Pre-assembly readiness check failed: Exam configuration has no sections defined.",
      });
    }

    if ((blueprint.totalQuestions ?? 0) <= 0) {
      throw new BadRequestException({
        code: "PRE_ASSEMBLY_READINESS_FAILED",
        message:
          "Pre-assembly readiness check failed: Exam configuration total question count must be greater than 0.",
      });
    }

    const sections: SectionDto[] = [];
    const allocatedQuestionIds = new Set<string>();
    const historyIds =
      await this.poolRepository.findRecentUsedQuestions(userId);

    const preloadedPool = await this.buildPreloadedPool(blueprint);

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
        preloadedPool,
      );

      const section = this.sectionBuilder.buildSection(
        blueprintSection,
        allocatedQuestions,
      );
      sections.push(section);
    }

    const validation = this.validator.validate(blueprint, sections);
    if (!validation.valid) {
      throw new InternalServerErrorException(
        `Assembly validation failed: ${validation.errors.join(", ")}`,
      );
    }

    return {
      testInstanceId: null, // dry run
      sections,
    };
  }

  async validateTest(configId: string, userId: string = "system-user") {
    if (!configId) throw new BadRequestException("configId is required");

    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);

    const sections: SectionDto[] = [];
    const allocatedQuestionIds = new Set<string>();
    const historyIds =
      await this.poolRepository.findRecentUsedQuestions(userId);

    const preloadedPool = await this.buildPreloadedPool(blueprint);

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
        preloadedPool,
      );

      const section = this.sectionBuilder.buildSection(
        blueprintSection,
        allocatedQuestions,
      );
      sections.push(section);
    }

    // Return the validation result without throwing
    return this.validator.validate(blueprint, sections);
  }

  async getAssembly(testInstanceId: string) {
    const instance = await this.persistenceService.getAssembly(testInstanceId);
    if (!instance) {
      throw new BadRequestException(
        `Test Instance ${testInstanceId} not found`,
      );
    }
    return instance;
  }
}
