import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { GenerationStrategyResolver } from "../services/generation-strategy-resolver.service";
import { ValidationRegistry } from "../registry/validation.registry";
import { PromptBuilderService } from "../prompt/prompt-builder.service";
import { QuestionAssemblerService } from "../assembler/question-assembler.service";
import { QuestionRepository } from "../repository/question.repository";
import { GenerationTrackingService } from "../services/generation-tracking.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { StyleValidationService } from "../services/style-validation.service";
import {
  QuestionGenerationRequestDto,
  ValidateQuestionRequestDto,
  BatchGenerationRequestDto,
} from "../dto/question-generation.dto";
import { RawQuestion } from "../interfaces/validation-strategy.interface";

@ApiTags("question-generation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("question-generation")
export class QuestionGenerationController {
  constructor(
    private readonly resolver: GenerationStrategyResolver,
    private readonly validationRegistry: ValidationRegistry,
    private readonly promptBuilder: PromptBuilderService,
    private readonly assembler: QuestionAssemblerService,
    private readonly questionRepository: QuestionRepository,
    private readonly trackingService: GenerationTrackingService,
    private readonly prisma: PrismaService,
    private readonly styleValidator: StyleValidationService,
  ) {}

  private async resolveStyleProfile(dto: QuestionGenerationRequestDto) {
    let styleProfile: any = null;
    const styleProfileId = dto.options?.styleProfileId as string;
    const blueprintId = dto.options?.blueprintId as string;

    if (styleProfileId) {
      styleProfile = await this.prisma.styleProfile.findUnique({
        where: { id: styleProfileId },
      });
    } else if (blueprintId) {
      const blueprint = await this.prisma.blueprint.findUnique({
        where: { id: blueprintId },
      });
      if (blueprint?.styleProfileId) {
        styleProfile = await this.prisma.styleProfile.findUnique({
          where: { id: blueprint.styleProfileId },
        });
      }
    }

    if (!styleProfile) {
      styleProfile = await this.prisma.styleProfile.findFirst({
        where: { isDefault: true, active: true },
      });
    }

    return styleProfile;
  }

  /**
   * POST /api/v1/question-generation/generate
   *
   * Full pipeline: Resolve → Context → Prompt → LLM → Validate → Assemble → Persist
   * Always persists the generated question to the Question pool.
   */
  @Post("generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Generate a question from a template using its declared generation strategy",
  })
  @ApiBody({ type: QuestionGenerationRequestDto })
  @ApiCreatedResponse({
    description:
      "Question generated, validated, and persisted to the question pool",
  })
  async generate(@Body() dto: QuestionGenerationRequestDto) {
    // 1. Resolve context — StrategyRegistry dispatches to the correct strategy
    const context = await this.resolver.resolve(dto.templateId);

    // Resolve and attach Style Profile to metadata
    const styleProfile = await this.resolveStyleProfile(dto);
    context.metadata = {
      ...(context.metadata || {}),
      styleProfile,
    };

    // 2. Build prompt from PromptTemplateRegistry and call LLM
    const rawQuestion = await this.promptBuilder.buildAndExecute(context);

    // 3. Validate via ValidationRegistry — no switch/if
    const validator = this.validationRegistry.resolve(context.strategy);
    const validationReport = await validator.validate(context, rawQuestion);

    // Style Validation
    const difficulty = (context.metadata?.difficulty as string) || "medium";
    const styleReport = await this.styleValidator.validate(
      styleProfile,
      rawQuestion,
      difficulty,
    );
    if (!styleReport.valid) {
      validationReport.valid = false;
      validationReport.errors = [
        ...(validationReport.errors || []),
        ...styleReport.errors,
      ];
    }
    validationReport.warnings = [
      ...(validationReport.warnings || []),
      ...styleReport.warnings,
    ];

    // 4. Assemble unified Question object (strategy-agnostic)
    const assembled = this.assembler.assemble(
      context,
      rawQuestion,
      dto.templateId,
    );

    // Snapshot the style profile inside question metadata for reproducibility
    if (styleProfile) {
      assembled.metadata = {
        ...(assembled.metadata || {}),
        styleProfileSnapshot: styleProfile,
      };
    }

    // 5. Persist via QuestionRepository (only service that writes to DB)
    const savedQuestion = await this.questionRepository.save(assembled);

    return {
      question: savedQuestion,
      generationStrategy: context.strategy,
      validationReport,
      contextSummary: assembled.metadata.contextSummary,
    };
  }

  /**
   * POST /api/v1/question-generation/preview
   *
   * Preview-only pipeline: Resolve → Context → Prompt → LLM
   * NEVER persists. Returns rendered preview text + context.
   */
  @Post("preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Preview a question without persisting — returns rendered question text and generation context",
  })
  @ApiBody({ type: QuestionGenerationRequestDto })
  @ApiOkResponse({
    description: "Preview generated — no data was saved to the database",
  })
  async preview(@Body() dto: QuestionGenerationRequestDto) {
    // 1. Resolve context
    const context = await this.resolver.resolve(dto.templateId);

    // Resolve and attach Style Profile to metadata
    const styleProfile = await this.resolveStyleProfile(dto);
    context.metadata = {
      ...(context.metadata || {}),
      styleProfile,
    };

    // 2. Build and execute prompt (LLM call) — no validation, no persistence
    const rawQuestion = await this.promptBuilder.buildAndExecute(context);

    return {
      previewText: rawQuestion.questionText,
      options: rawQuestion.options,
      correctAnswer: rawQuestion.correctAnswer,
      explanation: rawQuestion.explanation,
      context: {
        strategy: context.strategy,
        metadata: context.metadata,
        payload: context.payload,
      },
    };
  }

  /**
   * POST /api/v1/question-generation/validate
   *
   * Validate an existing or just-generated question against strategy rules.
   * Does NOT generate a new question or persist anything.
   */
  @Post("validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Validate a question against the strategy-specific validation rules",
  })
  @ApiBody({ type: ValidateQuestionRequestDto })
  @ApiOkResponse({ description: "Validation report returned" })
  async validate(@Body() dto: ValidateQuestionRequestDto) {
    // 1. Resolve context to get the strategy
    const context = await this.resolver.resolve(dto.templateId);

    // Resolve and attach Style Profile to metadata
    const styleProfile = await this.resolveStyleProfile(dto);
    context.metadata = {
      ...(context.metadata || {}),
      styleProfile,
    };

    // 2. Use the provided question or generate one if not supplied
    let rawQuestion: RawQuestion;
    if (dto.question) {
      rawQuestion = dto.question as unknown as RawQuestion;
    } else {
      rawQuestion = await this.promptBuilder.buildAndExecute(context);
    }

    // 3. Resolve validator from registry — no switch/if
    const validator = this.validationRegistry.resolve(context.strategy);
    const validationReport = await validator.validate(context, rawQuestion);

    // Style Validation
    const difficulty = (context.metadata?.difficulty as string) || "medium";
    const styleReport = await this.styleValidator.validate(
      styleProfile,
      rawQuestion,
      difficulty,
    );
    if (!styleReport.valid) {
      validationReport.valid = false;
      validationReport.errors = [
        ...(validationReport.errors || []),
        ...styleReport.errors,
      ];
    }
    validationReport.warnings = [
      ...(validationReport.warnings || []),
      ...styleReport.warnings,
    ];

    return {
      validationReport,
      strategy: context.strategy,
      templateId: dto.templateId,
    };
  }

  @Post("batch")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Start a background batch generation job" })
  @ApiBody({ type: BatchGenerationRequestDto })
  @ApiOkResponse({ description: "Batch generation job created" })
  async batchGenerate(@Body() dto: BatchGenerationRequestDto) {
    const context = await this.resolver.resolve(dto.templateId);

    // Create Job
    const job = await this.trackingService.createJob(
      dto.templateId,
      dto.count,
      context.strategy,
      context.metadata || {},
    );

    // Fire and forget actual generation loop
    this._processBatchInBackground(job.id, dto, context).catch((err) => {
      console.error(`Batch generation failed for job ${job.id}`, err);
    });

    return { jobId: job.id, status: job.status };
  }

  @Get("jobs/:templateId")
  @ApiOperation({ summary: "Get all generation jobs for a template" })
  async getJobs(@Param("templateId") templateId: string) {
    return this.trackingService.getJobsByTemplate(templateId);
  }

  @Get("audit/:jobId")
  @ApiOperation({ summary: "Get audit logs for a specific generation job" })
  async getAuditLogs(@Param("jobId") jobId: string) {
    return this.trackingService.getAuditLogsByJob(jobId);
  }

  private async _processBatchInBackground(
    jobId: string,
    dto: BatchGenerationRequestDto,
    context: any,
  ) {
    await this.trackingService.logEvent(
      dto.templateId,
      "INFO",
      "BATCH_STARTED",
      { count: dto.count },
      jobId,
    );

    const styleProfile = await this.resolveStyleProfile(dto);
    context.metadata = {
      ...(context.metadata || {}),
      styleProfile,
    };

    let failures = false;
    for (let i = 0; i < dto.count; i++) {
      try {
        const rawQuestion = await this.promptBuilder.buildAndExecute(context);
        const validator = this.validationRegistry.resolve(context.strategy);
        const report = await validator.validate(context, rawQuestion);

        const difficulty = (context.metadata?.difficulty as string) || "medium";
        const styleReport = await this.styleValidator.validate(
          styleProfile,
          rawQuestion,
          difficulty,
        );
        if (!styleReport.valid) {
          report.valid = false;
          report.errors = [...(report.errors || []), ...styleReport.errors];
        }

        if (!report.valid) {
          throw new Error(
            "Validation failed: " + JSON.stringify(report.errors),
          );
        }

        const assembled = this.assembler.assemble(
          context,
          rawQuestion,
          dto.templateId,
        );
        if (styleProfile) {
          assembled.metadata = {
            ...(assembled.metadata || {}),
            styleProfileSnapshot: styleProfile,
          };
        }
        await this.questionRepository.save(assembled);
        await this.trackingService.updateJobProgress(jobId, true);
        await this.trackingService.logEvent(
          dto.templateId,
          "INFO",
          "QUESTION_GENERATED",
          { iteration: i },
          jobId,
        );
      } catch (err: any) {
        failures = true;
        await this.trackingService.updateJobProgress(jobId, false);
        await this.trackingService.logEvent(
          dto.templateId,
          "ERROR",
          "GENERATION_FAILED",
          { iteration: i, error: err.message },
          jobId,
        );
      }
    }

    await this.trackingService.completeJob(jobId, failures);
    await this.trackingService.logEvent(
      dto.templateId,
      "INFO",
      "BATCH_COMPLETED",
      { hasFailures: failures },
      jobId,
    );
  }
}
