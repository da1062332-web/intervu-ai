import { Injectable, BadRequestException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationContextService } from "./generation-context.service";
import { TemplateSelectorService } from "./template-selector.service";
import { ParameterGeneratorService } from "./parameter-generator.service";
import { QuestionInstantiatorService } from "./question-instantiator.service";
import { QuestionValidationService } from "./question-validation.service";
import { GenerationRequestDto, GenerationResponseDto } from "../dto/generation.dto";

@Injectable()
export class GenerationOrchestratorService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly contextService: GenerationContextService,
    private readonly templateSelectorService: TemplateSelectorService,
    private readonly parameterGeneratorService: ParameterGeneratorService,
    private readonly questionInstantiatorService: QuestionInstantiatorService,
    private readonly validationService: QuestionValidationService,
  ) {}

  /**
   * Orchestrates the complete question generation flow.
   */
  async generateQuestions(examId: string, sectionId?: string, count: number = 1): Promise<GenerationResponseDto> {
    const startTime = Date.now();

    // 1. Resolve complete generation context
    const context = await this.contextService.loadContext(examId);

    // 2. Select section(s) to target
    let targetSections = context.sections;
    if (sectionId) {
      targetSections = context.sections.filter((s) => s.id === sectionId || s.code === sectionId);
      if (targetSections.length === 0) {
        throw new BadRequestException({
          success: false,
          error: {
            code: "INVALID_CONFIG",
            message: `Section with ID/Code ${sectionId} not found in exam context`,
          },
        });
      }
    }

    // 3. Distribute question count across sections and difficulties
    const distributions = this.distributeQuestions(targetSections, context.difficultyDistribution, count);

    let generatedCount = 0;
    let failedCount = 0;

    // 4. Generate questions sequentially
    for (const dist of distributions) {
      const { sectionId: targetSecId, difficulty, count: targetCount } = dist;

      // Resolve topic list for this section
      const sectionTopics = context.topics.filter((t) =>
        context.sections.find((s) => s.id === targetSecId)?.code === t.code || true
      ); // fallback or direct link

      if (sectionTopics.length === 0) continue;

      for (let i = 0; i < targetCount; i++) {
        // Pick topic (distribute evenly across section topics)
        const topic = sectionTopics[i % sectionTopics.length];

        const success = await this.generateSingleQuestionWithRetry({
          examId,
          sectionId: targetSecId,
          topicId: topic.id,
          difficulty,
          MAX_RETRIES: 3,
        });

        if (success) {
          generatedCount++;
        } else {
          failedCount++;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    await this.logGenerationStep({
      examId,
      step: "ORCHESTRATION_COMPLETE",
      status: failedCount === 0 ? "SUCCESS" : "FAILED",
      durationMs,
      retryCount: 0,
      message: `Batch generation complete. Generated: ${generatedCount}, Failed: ${failedCount}`,
    });

    if (generatedCount === 0 && count > 0) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "All question generation and validation attempts failed.",
        },
      });
    }

    return {
      success: generatedCount > 0,
      generated: generatedCount,
      failed: failedCount,
    };
  }

  /**
   * Generates a batch using DTO wrapper.
   */
  async generateBatch(dto: GenerationRequestDto): Promise<GenerationResponseDto> {
    return this.generateQuestions(dto.examId, dto.sectionId, dto.count);
  }

  /**
   * Regenerates a single question (replaces it by creating a new one matching same parameters).
   */
  async regenerateQuestion(questionId: string): Promise<any> {
    const existing = await this.prismaService.question.findUnique({
      where: { id: questionId },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${questionId} not found`,
        },
      });
    }

    // Generate new question matching same topic, section, and difficulty
    const startTime = Date.now();
    const result = await this.generateSingleQuestionWithRetry({
      examId: "REGENERATION",
      sectionId: existing.sectionId,
      topicId: existing.topicId,
      difficulty: existing.difficulty,
      MAX_RETRIES: 3,
    });

    if (!result) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "REGENERATION_FAILED",
          message: "Failed to regenerate question due to validation failures",
        },
      });
    }

    // Soft-delete/Archive original question (Day 2 lookahead status archived)
    await this.prismaService.question.update({
      where: { id: questionId },
      data: { status: "ARCHIVED" },
    });

    return {
      success: true,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Core workflow: template selection -> parameter generation -> instantiator -> validation -> transaction save.
   */
  private async generateSingleQuestionWithRetry(params: {
    examId: string;
    sectionId: string;
    topicId: string;
    difficulty: string;
    MAX_RETRIES: number;
  }): Promise<boolean> {
    const { examId, sectionId, topicId, difficulty, MAX_RETRIES } = params;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      const qStartTime = Date.now();
      let selectedTemplate: any = null;

      try {
        // 1. Template Selection
        selectedTemplate = await this.templateSelectorService.selectTemplate({
          topicId,
          difficulty,
          questionType: "multiple_choice",
        });

        // 2. Parameter Generation
        const generatedParams = this.parameterGeneratorService.generateParameters(selectedTemplate.metadata);

        // 3. Question Instantiation
        const instantiated = this.questionInstantiatorService.instantiate({
          template: {
            id: selectedTemplate.templateId,
            templateKey: selectedTemplate.metadata.templateKey,
            conceptKey: selectedTemplate.metadata.conceptKey,
            difficultyLevel: selectedTemplate.metadata.difficultyLevel,
            questionType: selectedTemplate.metadata.questionType,
            version: selectedTemplate.version,
            structure: selectedTemplate.metadata.structure,
            solutionSchema: selectedTemplate.metadata.solutionSchema,
          },
          parameters: generatedParams,
        });

        // 4. Multi-layered Validation checks
        const validationResult = await this.validationService.validateQuestion({
          questionText: instantiated.questionText,
          answer: instantiated.answer,
          explanation: instantiated.explanation,
          options: instantiated.options,
          difficulty: instantiated.difficulty,
          requestedDifficulty: difficulty,
          metadata: instantiated.metadata,
          topicId,
        });

        // Persist validation logs outside the main transaction boundary
        await this.prismaService.validationLog.create({
          data: {
            questionId: null,
            validationStage: "ALL_STAGES",
            isValid: validationResult.isValid,
            failureReason: validationResult.isValid ? null : validationResult.errors.join("; "),
            retryTriggered: !validationResult.isValid && retryCount < MAX_RETRIES - 1,
            errors: validationResult.errors,
            metadata: {
              templateId: selectedTemplate.templateId,
              retryCount,
              parameters: generatedParams,
            },
          },
        });

        if (validationResult.isValid) {
          const durationMs = Date.now() - qStartTime;

          // 5. Transaction Boundary: Save Question atomic with log updates
          const savedQuestion = await this.prismaService.$transaction(async (tx) => {
            // Save Question in the pool
            const q = await tx.question.create({
              data: {
                questionText: instantiated.questionText,
                answer: instantiated.answer,
                explanation: instantiated.explanation,
                topicId,
                sectionId,
                difficulty: instantiated.difficulty,
                difficultyScore: instantiated.difficultyScore,
                source: "GENERATED",
                templateId: selectedTemplate.templateId,
                version: 1,
                status: "DRAFT",
              },
            });

            // Replicate to GeneratedQuestion for legacy compatibility if required
            await tx.generatedQuestion.create({
              data: {
                templateId: selectedTemplate.templateId,
                questionHash: Math.random().toString(36).substring(7), // dummy random hash for schema constraint
                conceptKey: selectedTemplate.metadata.conceptKey,
                difficultyLevel: selectedTemplate.metadata.difficultyLevel,
                questionType: selectedTemplate.metadata.questionType,
                questionText: instantiated.questionText,
                options: instantiated.options,
                correctAnswer: instantiated.answer,
                solution: instantiated.explanation,
                metadata: instantiated.metadata,
              },
            });

            return q;
          });

          // Increment template usage cache
          this.templateSelectorService.incrementUsage(selectedTemplate.templateId);

          // Log successful generation
          await this.logGenerationStep({
            examId,
            sectionId,
            step: "SAVE_QUESTION",
            status: "SUCCESS",
            durationMs,
            templateId: selectedTemplate.templateId,
            retryCount,
            message: `Question generated successfully on attempt ${retryCount + 1}`,
          });

          return true;
        } else {
          // Increment retry counter since validation failed
          retryCount++;
        }
      } catch (err: any) {
        retryCount++;
        const durationMs = Date.now() - qStartTime;
        await this.logGenerationStep({
          examId,
          sectionId,
          step: "GENERATION_PIPELINE",
          status: "FAILED",
          durationMs,
          templateId: selectedTemplate?.templateId,
          retryCount,
          message: `Attempt ${retryCount} failed: ${err.message || err}`,
        });
      }
    }

    return false;
  }

  /**
   * Helper to write logs outside any rollback-sensitive transactions.
   */
  private async logGenerationStep(log: {
    examId: string;
    sectionId?: string;
    step: string;
    status: string;
    durationMs: number;
    templateId?: string;
    retryCount: number;
    message: string;
  }): Promise<void> {
    try {
      await this.prismaService.generationLog.create({
        data: {
          examId: log.examId,
          sectionId: log.sectionId || null,
          step: log.step,
          status: log.status,
          durationMs: log.durationMs,
          templateId: log.templateId || null,
          retryCount: log.retryCount,
          message: log.message,
        },
      });
    } catch (e) {
      // Fail silently to keep pipeline execution moving
    }
  }

  /**
   * Helper to partition requested counts across sections and difficulties.
   */
  private distributeQuestions(
    sections: any[],
    difficultyDistribution: { easy: number; medium: number; hard: number },
    totalCount: number,
  ): Array<{ sectionId: string; difficulty: string; count: number }> {
    const list: Array<{ sectionId: string; difficulty: string; count: number }> = [];

    // Distribute among difficulties first based on percentages
    const difficulties = ["EASY", "MEDIUM", "HARD"];
    const percentages = [
      difficultyDistribution.easy,
      difficultyDistribution.medium,
      difficultyDistribution.hard,
    ];

    // Simple distribution of counts matching percentages
    const difficultyCounts = difficulties.map((_, idx) => {
      return Math.round((percentages[idx] / 100) * totalCount);
    });

    // Make sure total adds up to totalCount
    const sum = difficultyCounts.reduce((a, b) => a + b, 0);
    if (sum !== totalCount) {
      const diff = totalCount - sum;
      difficultyCounts[1] += diff; // adjust medium
    }

    // Now distribute across sections
    for (const section of sections) {
      // Proportional section counts
      const secWeight = section.questionCount / sections.reduce((acc, s) => acc + s.questionCount, 0);

      difficulties.forEach((diffName, idx) => {
        const targetCount = Math.round(difficultyCounts[idx] * (isNaN(secWeight) ? 1 / sections.length : secWeight));
        if (targetCount > 0) {
          list.push({
            sectionId: section.id,
            difficulty: diffName,
            count: targetCount,
          });
        }
      });
    }

    // If list is empty due to rounding, force at least one distribution entry
    if (list.length === 0 && totalCount > 0) {
      list.push({
        sectionId: sections[0].id,
        difficulty: "MEDIUM",
        count: totalCount,
      });
    }

    return list;
  }
}
