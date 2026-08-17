import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionAllocatorService, AllocationConfig } from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { BlueprintSectionDto, AllocatedQuestionDto, AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProgressiveAssemblyWorkerService {
  private readonly logger = new Logger(ProgressiveAssemblyWorkerService.name);
  private readonly DEFAULT_ALLOCATION_CONFIG: AllocationConfig = {
    distribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly allocator: QuestionAllocatorService,
    private readonly sectionBuilder: SectionBuilderService,
    private readonly poolRepository: QuestionPoolRepository,
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

        // Persist to AssembledTestSection & AssembledTestQuestion
        const assembledSection = await this.prisma.assembledTestSection.create({
          data: {
            assemblyId,
            sectionKey: section.sectionKey,
            sectionName: section.displayName,
            durationSeconds: section.durationSeconds,
            questionCount: section.questionCount,
            orderIndex: section.orderIndex,
          },
        });

        if (section.questions && section.questions.length > 0) {
          await this.prisma.assembledTestQuestion.createMany({
            data: section.questions.map((q: AllocatedQuestionDto) => ({
              assemblyId,
              sectionId: assembledSection.id,
              questionId: q.questionId,
              questionOrder: q.questionOrder,
              questionSnapshot: q.questionSnapshot as Prisma.InputJsonValue,
            })),
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

        this.logger.log(
          `Populated section '${section.displayName}' (${section.questions.length} Qs) for assembly ${assemblyId}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed populating section '${blueprintSection.displayName}' for assembly ${assemblyId}: ${err?.message || err}`,
        );
      }
    }

    const durationMs = Date.now() - startMs;
    this.logger.log(
      `Completed background progressive section population for assembly ${assemblyId} in ${durationMs}ms ✅`,
    );
  }
}
