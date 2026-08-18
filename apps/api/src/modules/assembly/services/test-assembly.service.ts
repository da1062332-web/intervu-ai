import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
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
import { Optional } from "@nestjs/common";

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
    private readonly persistenceService: AssemblyPersistenceService,
    private readonly blueprintBuilder: BlueprintBuilderService,
    private readonly allocator: QuestionAllocatorService,
    private readonly sectionBuilder: SectionBuilderService,
    private readonly validator: AssemblyValidatorService,
    private readonly poolRepository: QuestionPoolRepository,
    private readonly assembledTestRepository: AssembledTestRepository,
    @Optional()
    private readonly progressiveWorker?: ProgressiveAssemblyWorkerService,
  ) {}

  async assembleTest(
    configId: string,
    userId: string = "system-user",
    forceNew: boolean = false,
    options?: { progressive?: boolean; isRetest?: boolean },
  ): Promise<string> {
    if (!configId) throw new BadRequestException("configId is required");

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

    const isRetestOrProgressive =
      options?.progressive === true || options?.isRetest === true;

    if (isRetestOrProgressive && this.progressiveWorker) {
      // --- Progressive Retest Mode ---
      // 1. Allocate & build Section 1 (index 0) synchronously for instant candidate test start (< 0.4s)
      const sec1Blueprint = blueprint.sections[0];
      const sec1Questions = await this.allocator.allocateQuestions(
        sec1Blueprint,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
      );
      const sec1 = this.sectionBuilder.buildSection(sec1Blueprint, sec1Questions);
      sections.push(sec1);

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
      const testInstanceId = await this.persistenceService.saveAssembly(
        configId,
        sections,
        userId,
      );

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
    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
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

    const testInstanceId = await this.persistenceService.saveAssembly(
      configId,
      sections,
      userId,
    );

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

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
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

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
        configId,
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
