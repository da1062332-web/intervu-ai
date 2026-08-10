import { randomUUID } from "crypto";
import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { Optional } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationStrategyResolver } from "../services/generation-strategy.resolver";
import { GenerationRetryService } from "../../generation-ai/retry/generation-retry.service";
import { ResponseValidatorService } from "../../generation-ai/validators/response-validator.service";
import { PromptBuilderService } from "../../generation-ai/prompts/prompt-builder.service";
import { CodingPatternGenerationStrategy } from "../../question-generation/strategies/coding-pattern/coding-pattern-generation.strategy";
import { QuestionAssemblerService } from "../../question-generation/assembler/question-assembler.service";
import { QuestionRepository } from "../../question-generation/repository/question.repository";

@ApiTags("question-generation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("question-generation")
export class QuestionGenerationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyResolver: GenerationStrategyResolver,
    private readonly responseValidator: ResponseValidatorService,
    @Inject(forwardRef(() => GenerationRetryService))
    private readonly retryService: GenerationRetryService,
    @Optional() private readonly codingPatternStrategy?: CodingPatternGenerationStrategy,
    @Optional() private readonly questionAssembler?: QuestionAssemblerService,
    @Optional() private readonly questionRepo?: QuestionRepository,
  ) {}

  @Post("generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Generate and save a question to the pool using SGE strategy context",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        templateId: { type: "string", example: "tpl_vocab" },
        count: { type: "number", example: 1 },
      },
      required: ["templateId"],
    },
  })
  async generateQuestion(
    @Body("templateId") templateId: string,
    @Body("count") count?: number,
  ) {
    const loopCount = count || 1;
    const generated: any[] = [];
    let validationReport = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // 1. Load the template or fallback to coding pattern
    let template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      const codingPattern = await this.prisma.codingPattern.findFirst({
        where: { OR: [{ id: templateId }, { patternKey: templateId }] },
      });

      if (codingPattern) {
        const metaConceptKey = (codingPattern.metadata as any)?.conceptKey || 'ARRYA';
        template = await this.prisma.template.upsert({
          where: { id: codingPattern.id },
          create: {
            id: codingPattern.id,
            templateKey: `cp_tpl_${codingPattern.id}`,
            name: codingPattern.title,
            conceptKey: metaConceptKey,
            generationStrategy: 'CODING_PATTERN' as any,
            questionType: 'CODING',
            difficultyLevel: codingPattern.difficulty,
          },
          update: {
            name: codingPattern.title,
            conceptKey: metaConceptKey,
            generationStrategy: 'CODING_PATTERN' as any,
            questionType: 'CODING',
          },
        });
      }
    }

    if (!template) {
      throw new NotFoundException(`Template or Coding Pattern with ID "${templateId}" not found`);
    }

    const config = await this.prisma.templateDatasetConfig.findUnique({
      where: { templateId: template.id },
    });

    const concept =
      (await this.prisma.concept.findFirst({
        where: { OR: [{ code: template.conceptKey }, { id: template.conceptKey }] },
      })) || (await this.prisma.concept.findFirst());

    if (!concept) {
      throw new BadRequestException(
        `Unable to resolve concept for template conceptKey "${template.conceptKey}"`,
      );
    }

    const topicId = concept.topicId;
    const sectionTopic = await this.prisma.sectionTopic.findFirst({
      where: { topicId },
    });
    let sectionId = sectionTopic?.sectionId;
    if (!sectionId) {
      const fallbackSection = await this.prisma.examSection.findFirst();
      sectionId = fallbackSection?.id || "fallback-section-id";
    }

    const job = await this.prisma.generationJob.create({
      data: {
        topic: concept.name || template.conceptKey || "General",
        count: loopCount,
        generated: 0,
        status: "RUNNING",
        category: template.questionType || "Standard",
        difficulty: template.difficultyLevel || "MEDIUM",
      },
    });

    try {
      for (let i = 0; i < loopCount; i++) {
        // 2. Resolve strategy context
        const context = await this.strategyResolver.resolve(templateId);

        if (
          context.generationStrategy === "CODING_PATTERN" ||
          (template as any).generationStrategy === "CODING_PATTERN" ||
          template.questionType === "CODING"
        ) {
          if (this.codingPatternStrategy && this.questionAssembler && this.questionRepo) {
            const codingContext = await this.codingPatternStrategy.generate(template);
            const payload = codingContext.payload as any;
            const rawQuestion = {
              questionText: payload.aiStatement?.narrative || template.description || "Coding Challenge",
              options: [],
              correctAnswer: JSON.stringify(payload.expectedOutput || {}),
              explanation: "Generated by Coding Pattern strategy",
            };
            const assembled = this.questionAssembler.assemble(
              codingContext,
              rawQuestion,
              template.id,
              topicId,
              sectionId,
            );
            const q = await this.questionRepo.save(assembled);
            generated.push(q);
            continue;
          }
        }

        const modeRaw =
          (template as any)?.datasetGenerationMode ||
          (template as any)?.config?.datasetGenerationMode ||
          (template as any)?.datasetConfig?.datasetGenerationMode ||
          (template as any)?.datasetConfigRelation?.datasetGenerationMode ||
          "AI";

        const templateData = {
          id: template.id,
          name: template.name,
          description: template.description,
          conceptKey: template.conceptKey,
          difficultyLevel: template.difficultyLevel,
          questionType: template.questionType,
          structure: template.structure,
          variableSchema: template.variableSchema,
          constraints: template.constraints,
          solutionSchema: template.solutionSchema,
          generationStrategy: context.generationStrategy,
          datasetGenerationMode: modeRaw,
          config: template.config,
          datasetConfig: template.datasetConfig,
        };

        // 3. Trigger SGE AI prompt compilation and LLM generation
        const result = await this.retryService.generateFromTemplate(
          templateData,
          context.variables,
          3,
          {
            datasetItem: context.datasetItem,
            logicalGraph: context.logicalGraph,
          },
        );

        if (!result.success || !result.question) {
          throw new BadRequestException(
            `SGE AI generation failed: ${result.errors?.join("; ") || "Unknown error"}`,
          );
        }

        try {
          this.responseValidator.validate(
            result.question,
            template.difficultyLevel,
            template.conceptKey,
            template,
          );
        } catch (err) {
          validationReport = {
            valid: false,
            errors: [
              err instanceof Error ? err.message : "Question validation failed",
            ],
            warnings: [],
          };
        }

        // 4. Atomically persist SGE question details to pool
        const q = await this.prisma.generatedQuestion.create({
          data: {
            questionText: result.question.question,
            questionHash: randomUUID(),
            templateId: template.id,
            conceptKey: concept.code,
            difficultyLevel: template.difficultyLevel,
            questionType: template.questionType,
            options: result.question.options as any,
            correctAnswer:
              result.question.correctAnswer || result.question.answer || "",
            solution: result.question.explanation,
            metadata: {
              status: "GENERATED",
              generationStrategy: context.generationStrategy,
              datasetGenerationMode:
                result.question.metadata?.datasetGenerationMode ??
                (template as any)?.datasetGenerationMode ??
                (config as any)?.datasetGenerationMode ??
                "AI",
              isAiGenerated: result.question.metadata?.isAiGenerated ?? true,
              generationSource:
                result.question.metadata?.generationSource ??
                (result.question.metadata?.isFallbackDatasetFetch
                  ? "DIRECT_DATASET_FETCH"
                  : "AI_LLM_MODEL"),
              isFallbackDatasetFetch:
                result.question.metadata?.isFallbackDatasetFetch ?? false,
              variables: context.variables,
              datasetItem: context.datasetItem,
              logicalGraph: context.logicalGraph,
              lineage: {
                datasetId: config?.datasetId || null,
                datasetItemId: context.datasetItem?.id || null,
                templateId: template.id,
                templateVersion: template.version,
                variablesUsed: context.variables,
                mappingUsed: config?.variableMapping || {},
                promptVersion: 1,
              },
            },
          },
        });

        generated.push(q);
      }

      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          generated: generated.length,
        },
      });
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.prisma.generationJob
        .update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            error: errorMsg,
            generated: generated.length,
          },
        })
        .catch(() => {});
      await this.prisma.generationLog
        .create({
          data: {
            examId: job.id,
            step: "GENERATE_QUESTION",
            status: "FAILED",
            durationMs: 0,
            retryCount: 3,
            message: errorMsg,
          },
        })
        .catch(() => {});
      throw err;
    }

    return {
      success: true,
      count: generated.length,
      questions: generated,
      question: generated.length === 1 ? generated[0] : undefined,
      validationReport,
    };
  }

  @Post("batch")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Generate a batch of questions using SGE strategy context",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        templateId: { type: "string", example: "tpl_vocab" },
        count: { type: "number", example: 10 },
      },
      required: ["templateId", "count"],
    },
  })
  async generateQuestionBatch(
    @Body("templateId") templateId: string,
    @Body("count") count: number,
  ) {
    return this.generateQuestion(templateId, count);
  }

  @Post("preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Generate and return a preview question using SGE strategy context without saving",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        templateId: { type: "string", example: "tpl_vocab" },
      },
      required: ["templateId"],
    },
  })
  async previewQuestion(@Body("templateId") templateId: string) {
    let template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      const codingPattern = await this.prisma.codingPattern.findFirst({
        where: { OR: [{ id: templateId }, { patternKey: templateId }] },
      });

      if (codingPattern) {
        const metaConceptKey = (codingPattern.metadata as any)?.conceptKey || 'ARRYA';
        template = await this.prisma.template.upsert({
          where: { id: codingPattern.id },
          create: {
            id: codingPattern.id,
            templateKey: `cp_tpl_${codingPattern.id}`,
            name: codingPattern.title,
            conceptKey: metaConceptKey,
            generationStrategy: 'CODING_PATTERN' as any,
            questionType: 'CODING',
            difficultyLevel: codingPattern.difficulty,
          },
          update: {
            name: codingPattern.title,
            conceptKey: metaConceptKey,
            generationStrategy: 'CODING_PATTERN' as any,
            questionType: 'CODING',
          },
        });
      }
    }

    if (!template) {
      throw new NotFoundException(`Template or Coding Pattern with ID "${templateId}" not found`);
    }

    // 1. Resolve strategy context
    const context = await this.strategyResolver.resolve(templateId);

    if (
      context.generationStrategy === "CODING_PATTERN" ||
      (template as any).generationStrategy === "CODING_PATTERN" ||
      template.questionType === "CODING"
    ) {
      if (this.codingPatternStrategy) {
        const codingContext = await this.codingPatternStrategy.generate(template);
        const payload = codingContext.payload as any;
        return {
          previewText: payload.aiStatement?.narrative || template.description || "Coding Challenge",
          options: [],
          correctAnswer: JSON.stringify(payload.expectedOutput || {}),
          explanation: "Preview of Coding Pattern strategy",
          context: codingContext,
        };
      }
    }

    // 2. Trigger SGE AI prompt builder and generation
    const modeRawPreview =
      (template as any)?.datasetGenerationMode ||
      (template as any)?.config?.datasetGenerationMode ||
      (template as any)?.datasetConfig?.datasetGenerationMode ||
      (template as any)?.datasetConfigRelation?.datasetGenerationMode ||
      "AI";

    const templateData = {
      id: template.id,
      name: template.name,
      description: template.description,
      conceptKey: template.conceptKey,
      difficultyLevel: template.difficultyLevel,
      questionType: template.questionType,
      structure: template.structure,
      variableSchema: template.variableSchema,
      constraints: template.constraints,
      solutionSchema: template.solutionSchema,
      generationStrategy: context.generationStrategy,
      datasetGenerationMode: modeRawPreview,
      config: template.config,
      datasetConfig: template.datasetConfig,
    };

    const result = await this.retryService.generateFromTemplate(
      templateData,
      context.variables,
      3,
      {
        datasetItem: context.datasetItem,
        logicalGraph: context.logicalGraph,
      },
    );

    if (!result.success || !result.question) {
      throw new BadRequestException(
        `SGE AI generation failed: ${result.errors?.join("; ") || "Unknown error"}`,
      );
    }

    return {
      success: true,
      question: result.question,
      context: {
        generationStrategy: context.generationStrategy,
        variables: context.variables,
        datasetItem: context.datasetItem,
        logicalGraph: context.logicalGraph,
      },
    };
  }

  @Post("dataset-preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Preview how dataset values populate template variables and prompts before generation",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        templateId: { type: "string" },
      },
      required: ["templateId"],
    },
  })
  async previewDataset(@Body("templateId") templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException(`Template with ID "${templateId}" not found`);
    }

    const context = await this.strategyResolver.resolve(templateId);

    const promptConfig = await this.prisma.templatePromptConfig.findUnique({
      where: { templateId: template.id },
    });

    const promptBuilder = new PromptBuilderService();
    const mockInput = {
      template: {
        ...template,
        generationStrategy: context.generationStrategy,
      },
      variableValues: context.variables,
      datasetItem: context.datasetItem,
      promptConfig: promptConfig || undefined,
      styleProfile: undefined,
    };
    const compiledPrompt = promptBuilder.buildPrompt(mockInput as any);

    let parsedStructure: any = {};
    try {
      parsedStructure =
        typeof template.structure === "string"
          ? JSON.parse(template.structure)
          : template.structure || {};
    } catch (e) {
      parsedStructure = {};
    }

    let questionTemplateObj = parsedStructure.questionTemplate;
    if (typeof questionTemplateObj === "string") {
      try {
        questionTemplateObj = JSON.parse(questionTemplateObj);
      } catch (e) {}
    }

    const stemTemplate = questionTemplateObj?.stem || "";
    const interpolatedStem = promptBuilder.interpolate(
      stemTemplate,
      context.variables,
    );

    const generationPrompt = questionTemplateObj?.generationPrompt;
    const finalUserPrompt = generationPrompt || promptConfig?.userPrompt;

    const interpolatedUserPrompt = finalUserPrompt
      ? promptBuilder.interpolate(finalUserPrompt, {
          content: context.datasetItem?.content || "",
          ...context.variables,
        })
      : "";

    const interpolatedInstructions = promptConfig?.instructions
      ? promptBuilder.interpolate(promptConfig.instructions, context.variables)
      : "";

    return {
      success: true,
      variables: context.variables,
      datasetItem: context.datasetItem,
      interpolatedStem,
      interpolatedUserPrompt,
      interpolatedInstructions,
      compiledPrompt,
    };
  }

  @Post("validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate an existing pool question using strategy checks",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        questionId: { type: "string" },
      },
      required: ["questionId"],
    },
  })
  async validateQuestion(@Body("questionId") questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID "${questionId}" not found`);
    }

    const template = question.templateId
      ? await this.prisma.template.findUnique({
          where: { id: question.templateId },
        })
      : null;

    // Build generated question structure for validator
    const metadata = (question.metadata as any) || {};
    const validationQuestion = {
      question: question.questionText,
      options: metadata.options || [],
      correctAnswer: question.answer,
      answer: question.answer,
      explanation: question.explanation,
      difficulty: question.difficulty.toLowerCase(),
      topic: "synonyms", // fallback topic check
      metadata: {
        generationStrategy: metadata.generationStrategy || "VARIABLE",
        variables: metadata.variables || {},
        datasetItem: metadata.datasetItem,
        logicalGraph: metadata.logicalGraph,
      },
    };

    let isValid = true;
    let error: string | null = null;

    try {
      this.responseValidator.validate(
        validationQuestion as any,
        question.difficulty.toLowerCase(),
        "synonyms",
        template as any,
      );
    } catch (e: any) {
      isValid = false;
      error = e.message || String(e);
    }

    return {
      success: true,
      isValid,
      error,
    };
  }
}
