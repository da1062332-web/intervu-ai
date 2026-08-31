import { Injectable, Logger, Optional, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionAllocatorService, AllocationConfig } from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { BlueprintSectionDto, AllocatedQuestionDto, AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { Prisma } from "@prisma/client";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { AssemblyValidatorService } from "../validators/assembly-validator.service";

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
  ) {}

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

    for (const blueprintSection of remainingBlueprintSections) {
      try {
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

        if (this.validator) {
          const valResult = this.validator.validate(
            { configId, sections: [blueprintSection] } as any,
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
          await this.prisma.testInstanceQuestion.createMany({
            data: section.questions.map((q: AllocatedQuestionDto, idx: number) => ({
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
