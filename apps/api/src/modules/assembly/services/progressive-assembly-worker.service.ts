import { Injectable, Logger, Optional, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionAllocatorService, AllocationConfig, PreloadedTopicPool } from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { BlueprintSectionDto, AllocatedQuestionDto, AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { Prisma, GeneratedQuestion } from "@prisma/client";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { AssemblyValidatorService } from "../validators/assembly-validator.service";
import { FinalShufflerService } from "../../tests/start-test/final-shuffler.service";

@Injectable()
export class ProgressiveAssemblyWorkerService {
  private readonly logger = new Logger(ProgressiveAssemblyWorkerService.name);
  private readonly DEFAULT_ALLOCATION_CONFIG: AllocationConfig = {
    distribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
  };

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(QuestionAllocatorService) private readonly allocator: QuestionAllocatorService,
    @Inject(SectionBuilderService) private readonly sectionBuilder: SectionBuilderService,
    @Inject(QuestionPoolRepository) private readonly poolRepository: QuestionPoolRepository,
    @Optional() @Inject(AssemblyValidatorService) private readonly validator?: AssemblyValidatorService,
    @Optional() @Inject(RedisCacheService) private readonly cacheService?: RedisCacheService,
    @Optional() @Inject(FinalShufflerService) private readonly finalShuffler?: FinalShufflerService,
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

  /**
   * Asynchronously populates questions for remaining sections in the background while candidate takes Section 1.
   */
  async populateRemainingSections(
    assemblyId: string,
    configId: string,
    userId: string,
    remainingBlueprintSections: BlueprintSectionDto[],
    allocatedQuestionIds: Set<string>,
    historyIds: string[],
  ): Promise<void> {
    this.logger.log(
      `Starting background progressive section population for assembly ${assemblyId} (${remainingBlueprintSections.length} section(s) remaining)`,
    );

    const startMs = Date.now();

    const topicIdSet = new Set<string>();
    for (const sec of remainingBlueprintSections) {
      for (const t of sec.topicAllocations || []) {
        if (t.topicId) topicIdSet.add(t.topicId);
      }
    }

    let preloadedPool: PreloadedTopicPool | undefined;
    if (topicIdSet.size > 0) {
      try {
        const allTopicIds = Array.from(topicIdSet);
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
        preloadedPool = new Map();
        for (const q of dbQuestions) {
          const gq = this.mapDbQuestionToGenerated(q);
          const tId = q.topicId;
          if (!preloadedPool.has(tId)) {
            preloadedPool.set(tId, { EASY: [], MEDIUM: [], HARD: [], ALL: [] });
          }
          const bucket = preloadedPool.get(tId)!;
          bucket.ALL.push(gq);
          const diff = (gq.difficultyLevel || "MEDIUM").toUpperCase();
          if (diff === "EASY") bucket.EASY.push(gq);
          else if (diff === "HARD") bucket.HARD.push(gq);
          else bucket.MEDIUM.push(gq);
        }
        this.poolRepository.seedQuestions(dbQuestions);
      } catch (poolErr) {
        this.logger.warn(`Failed to preload question pool in worker: ${poolErr}`);
      }
    }

    for (const blueprintSection of remainingBlueprintSections) {
      try {
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

        if (this.validator) {
          const valResult = this.validator.validate(
            {
              testConfigId: configId,
              totalQuestions: blueprintSection.questionCount,
              totalDurationSeconds: blueprintSection.durationSeconds,
              sections: [blueprintSection],
            } as any,
            [section],
          );
          if (!valResult.valid) {
            this.logger.warn(
              `Section '${blueprintSection.displayName}' validation warning for assembly ${assemblyId}: ${valResult.errors.join("; ")}`,
            );
          }
        }

        // Find or create AssembledTestSection
        let assembledSection = await this.prisma.assembledTestSection.findFirst({
          where: { assemblyId, sectionKey: section.sectionKey },
        });

        if (!assembledSection) {
          assembledSection = await this.prisma.assembledTestSection.create({
            data: {
              assemblyId,
              sectionKey: section.sectionKey,
              sectionName: section.displayName,
              durationSeconds: section.durationSeconds,
              questionCount: section.questionCount,
              orderIndex: section.orderIndex,
            },
          });
        }

        if (section.questions && section.questions.length > 0) {
          await this.prisma.assembledTestQuestion.createMany({
            data: section.questions.map((q: AllocatedQuestionDto) => ({
              assemblyId,
              sectionId: assembledSection!.id,
              questionId: q.questionId,
              questionOrder: q.questionOrder,
              questionSnapshot: q.questionSnapshot as Prisma.InputJsonValue,
            })),
            skipDuplicates: true,
          });
        }

        // Persist to TestInstanceSection & TestInstanceQuestion for execution controller
        const instanceSectionId = `sec_inst_${assemblyId}_${section.sectionKey}`;
        await this.prisma.testInstanceSection.upsert({
          where: { id: instanceSectionId },
          create: {
            id: instanceSectionId,
            testInstanceId: assemblyId,
            sectionKey: section.sectionKey,
            sectionName: (section as any).sectionName || section.displayName || "Section",
            durationSeconds: section.durationSeconds,
            questionCount: section.questionCount,
            orderIndex: section.orderIndex || 0,
          },
          update: {
            questionCount: section.questionCount,
          },
        });

        if (section.questions && section.questions.length > 0) {
          let questionsToPersist: any[] = section.questions;
          if (this.finalShuffler) {
            const ruleFlags = await this.prisma.ruleFlags.findUnique({
              where: { examConfigId: configId },
            });
            const shuffleQuestions = ruleFlags?.shuffleQuestionsEnabled !== false;
            const shuffleOptions = ruleFlags?.shuffleOptionsEnabled !== false;

            if (shuffleQuestions || shuffleOptions) {
              const shuffled = this.finalShuffler.shuffleSections(
                [section as any],
                { shuffleQuestionsEnabled: shuffleQuestions, shuffleOptionsEnabled: shuffleOptions },
              );
              questionsToPersist = shuffled[0]?.questions || section.questions;
            }
          }

          await this.prisma.testInstanceQuestion.createMany({
            data: questionsToPersist.map((q: any, idx: number) => ({
              testInstanceId: assemblyId,
              sectionId: instanceSectionId,
              questionId: q.questionId,
              questionOrder: q.questionOrder ?? idx,
              questionSnapshot: (q.questionSnapshot as unknown as Prisma.InputJsonValue) || {},
            })),
            skipDuplicates: true,
          });
        }

        // Invalidate Redis snapshot cache for this test instance so questions appear immediately
        if (this.cacheService) {
          await Promise.allSettled([
            this.cacheService.delete(`assessment-snapshot:${assemblyId}`),
            this.cacheService.delete(`test-instance:meta:${assemblyId}`),
          ]);
        }

        this.logger.log(
          `Populated section '${section.displayName}' (${section.questions.length} Qs) for assembly ${assemblyId}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed populating section '${blueprintSection.displayName}' for assembly ${assemblyId}: ${err?.message || err}`,
          err?.stack,
        );
        try {
          await this.prisma.testInstanceSection.updateMany({
            where: { testInstanceId: assemblyId, sectionKey: blueprintSection.sectionKey },
            data: { status: "FAILED" },
          });
        } catch {
          // ignore if record not yet created
        }
      }
    }

    const durationMs = Date.now() - startMs;
    this.logger.log(
      `Completed background progressive section population for assembly ${assemblyId} in ${durationMs}ms ✅`,
    );
  }
}
