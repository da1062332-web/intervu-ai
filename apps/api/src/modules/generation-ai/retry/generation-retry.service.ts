import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  PreviewErrorDetails,
  PreviewGenerationException,
  TemplateGenerationException,
} from "../../../core/exceptions";
import { PromptBuilderService } from "../prompts/prompt-builder.service";
import { QuestionGeneratorService } from "../generators/question-generator.service";
import { OptionGeneratorService } from "../generators/option-generator.service";
import { ExplanationGeneratorService } from "../generators/explanation-generator.service";
import { ResponseValidatorService } from "../validators/response-validator.service";
import { ParameterGeneratorService } from "../../generation/services/parameter-generator.service";
import { DatasetLoaderService } from "../../generation/services/dataset-loader.service";
import { EntityGeneratorService } from "../../generation/services/entity-generator.service";
import { GenerationAuditService } from "../services/generation-audit.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { DuplicateDetectorService } from "../validators/duplicate-detector.service";
import { QuestionQualityService } from "../scorers/question-quality.service";
import {
  formatInterpolatedDisplayValue,
  normalizeDisplayQuestion,
} from "../utils/display-value-formatter";

export interface RetryResult {
  attempts: number;
  success: boolean;
  question?: GeneratedQuestionDto;
  errors?: string[];
}

@Injectable()
export class GenerationRetryService {
  private readonly logger = new Logger(GenerationRetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly questionGenerator: QuestionGeneratorService,
    private readonly optionGenerator: OptionGeneratorService,
    private readonly explanationGenerator: ExplanationGeneratorService,
    private readonly responseValidator: ResponseValidatorService,
    private readonly auditService: GenerationAuditService,
    private readonly duplicateDetector: DuplicateDetectorService,
    private readonly qualityScorer: QuestionQualityService,
    private readonly parameterGenerator: ParameterGeneratorService,
    private readonly datasetLoader: DatasetLoaderService,
    private readonly entityGenerator: EntityGeneratorService,
  ) {}

  /**
   * Main retry-loop orchestrator for generating questions from category, topic, and difficulty.
   */
  async generateWithRetry(
    category: string,
    topic: string,
    difficulty: string,
    maxAttempts: number = 3,
    options?: {
      datasetItem?: any;
      logicalGraph?: any;
      correctAnswer?: string;
      styleProfile?: any;
      styleProfileId?: string;
    },
  ): Promise<RetryResult> {
    const normDiff = difficulty.toUpperCase();
    const cleanTopic = topic.trim();

    // 1. Fetch matching template from the database
    let template = await this.prisma.template.findFirst({
      where: {
        conceptKey: {
          equals: cleanTopic,
          mode: "insensitive",
        },
        difficultyLevel: normDiff as any,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!template) {
      // Fallback: active template matching the topic/concept regardless of difficulty
      template = await this.prisma.template.findFirst({
        where: {
          conceptKey: {
            equals: cleanTopic,
            mode: "insensitive",
          },
          isActive: true,
          deletedAt: null,
        },
      });
    }

    if (!template) {
      // Fallback 2: first active template in database
      template = await this.prisma.template.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
        },
      });
    }

    // Resolve template data structure
    const templateData = template
      ? {
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
          generationStrategy:
            (template as any).generationStrategy || "VARIABLE",
        }
      : {
          id: "fallback_id",
          name: `Standard ${category.toUpperCase()} Template`,
          description: `Fallback template for topic: ${topic}`,
          conceptKey: topic,
          difficultyLevel: normDiff,
          questionType: "mcq",
          structure: {
            questionTemplate: `Solve this ${category} problem about ${topic} at ${difficulty} level.`,
          },
          variableSchema: { variables: [] },
          constraints: { constraints: [] },
          solutionSchema: {
            steps: [
              "Step 1: Parse parameter values",
              "Step 2: Solve formula",
              "Step 3: State final answer",
            ],
            finalAnswer: "Mock Answer",
          },
          generationStrategy: "VARIABLE",
        };

    const cat = category.toLowerCase();
    let defaultStrategy = "VARIABLE";
    if (
      cat.includes("verbal") ||
      cat.includes("reading") ||
      cat.includes("english") ||
      cat.includes("vocabulary")
    ) {
      defaultStrategy = "DATASET";
    } else if (
      cat.includes("logical") ||
      cat.includes("puzzle") ||
      cat.includes("relation")
    ) {
      defaultStrategy = "HYBRID";
    }

    const finalStrategy = templateData.generationStrategy || defaultStrategy;
    templateData.generationStrategy = finalStrategy;

    let datasetItem =
      (template as any)?.datasetItem ||
      (template as any)?.metadata?.datasetItem;
    if (!datasetItem && finalStrategy === "DATASET" && template) {
      try {
        datasetItem = await this.datasetLoader.loadDatasetItem(template as any);
      } catch {
        datasetItem = {
          content: `Reading Passage context for ${topic} at ${difficulty} level. Modern technology is reshaping traditional educational frameworks. Assessments are moving towards dynamic, skill-based evaluations rather than static test structures. This shift is crucial for accurately measuring candidate potential in real-world scenarios.`,
          metadata: { topic, difficulty },
        };
      }
    }

    let logicalGraph =
      (template as any)?.logicalGraph ||
      (template as any)?.metadata?.logicalGraph;
    if (!logicalGraph && finalStrategy === "HYBRID" && template) {
      try {
        logicalGraph = this.entityGenerator.generateGraph(template as any);
      } catch {
        logicalGraph = {
          entities: ["Rohan", "Amit", "Neha"],
          relations: [
            { source: "Rohan", target: "Amit", type: "brother" },
            { source: "Amit", target: "Neha", type: "father" },
          ],
        };
      }
    }

    // 2. Generate parameter values
    let variableValues: Record<string, any> = {};
    if (template && finalStrategy === "VARIABLE") {
      try {
        variableValues = this.parameterGenerator.generateParameters(
          template as any,
        );
      } catch (error) {
        if (error instanceof TemplateGenerationException) {
          error.templateId = template?.id;
          const res = typeof error.getResponse === "function" ? (error.getResponse() as any) : {};
          if (typeof res === "object" && res !== null) res.template_id = template?.id;
          throw error;
        }
        if (error instanceof PreviewGenerationException) {
          throw error;
        }

        const classified = this.classifyPreviewFailure(
          error,
          "parameter-generator",
        );
        if (!classified.retryable) {
          throw new PreviewGenerationException(
            classified.message,
            classified.details,
          );
        }
        variableValues = {};
      }
    }

    return this.generateFromTemplate(
      templateData,
      variableValues,
      maxAttempts,
      { datasetItem, logicalGraph, ...(options || {}) },
    );
  }

  /**
   * Compiles dynamic prompt, runs generation and full multi-stage validation checks.
   */
  async generateFromTemplate(
    template: any,
    variableValues: Record<string, unknown>,
    maxAttempts: number = 3,
    options?: {
      datasetItem?: any;
      logicalGraph?: any;
      correctAnswer?: string;
      styleProfile?: any;
      styleProfileId?: string;
    },
  ): Promise<RetryResult> {
    let attempts = 0;
    const errors: string[] = [];

    // Fetch custom prompt configuration if strategy is DATASET
    let promptConfig: any = undefined;
    if (
      template.id &&
      (template.generationStrategy === "DATASET" ||
        (template as any).strategy === "DATASET")
    ) {
      promptConfig = await this.prisma.templatePromptConfig.findUnique({
        where: { templateId: template.id },
      });
    }

    // Resolve styleProfile from options or load default
    let styleProfile = (options as any)?.styleProfile;
    if (!styleProfile && (options as any)?.styleProfileId) {
      styleProfile = await this.prisma.styleProfile.findUnique({
        where: { id: (options as any).styleProfileId },
      });
    }
    if (!styleProfile) {
      styleProfile = await this.prisma.styleProfile.findFirst({
        where: { isDefault: true, active: true },
      });
    }

    // NOTE: we will build the prompt inside the attempt loop because for VARIABLE
    // strategy we want to regenerate variable values on each attempt to avoid
    // producing identical outputs which would be flagged as duplicates.

    const difficulty = template.difficultyLevel.toLowerCase();
    const topic = template.conceptKey;

    let promptStr = "";
    const attemptAvoidQuestions: string[] = [];

    // Pre-populate avoidQuestions with existing questions from database for this template/topic
    try {
      const existingQuestions = await this.prisma.question.findMany({
        where: {
          OR: [
            template.id ? { templateId: template.id } : undefined,
            topic
              ? { topic: { name: { equals: topic, mode: "insensitive" } } }
              : undefined,
            topic
              ? { topic: { code: { equals: topic, mode: "insensitive" } } }
              : undefined,
          ].filter(Boolean) as any,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { questionText: true },
      });
      for (const eq of existingQuestions) {
        if (eq.questionText && eq.questionText.trim()) {
          attemptAvoidQuestions.push(eq.questionText.trim());
        }
      }
    } catch {
      // Non-blocking if database query fails
    }

    // Track all attempt errors across the retry loop so previousAttemptError is correctly passed on retries
    const allAttemptErrors: string[] = [];

    // For DATASET+AI strategy, track the current dataset item and all tried IDs
    // so we can reload a DIFFERENT item on duplicate hits (even if SPECIFIC selection mode)
    let currentDatasetItem = options?.datasetItem;
    const triedDatasetItemIds: string[] = [];
    if (currentDatasetItem?.id) {
      triedDatasetItemIds.push(currentDatasetItem.id);
    }

    while (attempts < maxAttempts) {
      attempts++;
      this.logger.log(
        `[GenerationAudit] [Attempt ${attempts}/${maxAttempts}] Generating for template "${template.name || template.id}" (Concept: ${topic}, Difficulty: ${difficulty}, Strategy: ${template.generationStrategy || "VARIABLE"})`,
      );
      let response = "";
      let parsedQuestion: GeneratedQuestionDto | undefined;
      let validationSuccess = false;
      let cachedQualityScore: number | undefined;
      const attemptErrors: string[] = [];

      try {
        // For VARIABLE strategy, always regenerate parameter values on every attempt
        // This is critical: if we reuse the same variables, hydrateCanonicalQuestion
        // will produce the same question text and ALL retries will fail duplicate detection.
        let attemptVariables = variableValues;
        if ((template as any)?.generationStrategy === "VARIABLE") {
          try {
            attemptVariables = this.parameterGenerator.generateParameters(
              template as any,
            );
          } catch (error) {
            if (error instanceof TemplateGenerationException) {
              error.templateId = template?.id;
              const res = typeof error.getResponse === "function" ? (error.getResponse() as any) : {};
              if (typeof res === "object" && res !== null) res.template_id = template?.id;
              throw error;
            }
            if (error instanceof PreviewGenerationException) {
              const details = error.details as PreviewErrorDetails | undefined;
              this.logger.warn(
                `[preview] ${details?.category || "FORMULA_ERROR"} from parameter-generator: ${error.message}`,
              );
              throw error;
            }

            const classified = this.classifyPreviewFailure(
              error,
              "parameter-generator",
            );
            if (!classified.retryable) {
              this.logger.warn(
                `[preview] ${classified.category} from ${classified.details.source}: ${classified.reason}`,
              );
              throw new PreviewGenerationException(
                classified.message,
                classified.details,
              );
            }
            attemptVariables = variableValues;
          }
        }

        const isDatasetStrategy =
          (template as any)?.generationStrategy === "DATASET" ||
          (template as any)?.strategy === "DATASET";

        const rawMode =
          (template as any)?.datasetGenerationMode ||
          (template as any)?.config?.datasetGenerationMode ||
          (template as any)?.datasetConfig?.datasetGenerationMode ||
          (options as any)?.datasetGenerationMode ||
          "AI";
        const datasetGenerationMode: "DIRECT" | "AI" =
          String(rawMode).toUpperCase() === "DIRECT" ? "DIRECT" : "AI";

        if (
          isDatasetStrategy &&
          datasetGenerationMode === "DIRECT" &&
          options?.datasetItem
        ) {
          const dsItem = options.datasetItem;
          parsedQuestion = {
            question:
              dsItem.questionText ||
              dsItem.content ||
              "No question text provided.",
            options: dsItem.options || [],
            correctAnswer: dsItem.answer || "",
            answer: dsItem.answer || "",
            explanation: dsItem.explanation || "Directly fetched from dataset.",
            difficulty: difficulty,
            topic: topic,
            metadata: {
              ...(dsItem.metadata || {}),
              status: "GENERATED",
              templateId: template.id,
              generationStrategy: "DATASET",
              datasetGenerationMode: "DIRECT",
              datasetItem: dsItem,
              isFallbackDatasetFetch: false,
              isAiGenerated: false,
              generationSource: "DIRECT_DATASET_FETCH",
            },
          };
        } else {
          // Compile dynamic structured prompt for this attempt
          promptStr = this.promptBuilder.buildPrompt({
            template,
            variableValues: attemptVariables,
            correctAnswer: options?.correctAnswer,
            datasetItem: currentDatasetItem,
            logicalGraph: options?.logicalGraph,
            promptConfig: promptConfig || undefined,
            styleProfile,
            avoidQuestions: attemptAvoidQuestions.length > 0 ? attemptAvoidQuestions : undefined,
            previousAttemptError: allAttemptErrors.length > 0 ? allAttemptErrors[allAttemptErrors.length - 1] : undefined,
          });

          // 1. Generate LLM Output for AI mode — calibrated temperature for precision & self-correction
          const attemptTemperature = attempts === 1 ? 0.4 : attempts === 2 ? 0.7 : 0.9;
          try {
            response = await this.questionGenerator.generate(promptStr, attemptTemperature);
          } catch (llmErr) {
            if (isDatasetStrategy && options?.datasetItem) {
              const dsItem = options.datasetItem;
              parsedQuestion = {
                question:
                  dsItem.questionText ||
                  dsItem.content ||
                  "No question text provided.",
                options: dsItem.options || [],
                correctAnswer: dsItem.answer || "",
                answer: dsItem.answer || "",
                explanation:
                  dsItem.explanation || "Directly fetched from dataset.",
                difficulty: difficulty,
                topic: topic,
                metadata: {
                  ...(dsItem.metadata || {}),
                  status: "GENERATED",
                  templateId: template.id,
                  generationStrategy: "DATASET",
                  datasetGenerationMode: "AI",
                  datasetItem: dsItem,
                  isFallbackDatasetFetch: true,
                  isAiGenerated: false,
                  generationSource: "DIRECT_DATASET_FETCH",
                },
              };
            } else {
              throw llmErr;
            }
          }

          if (!parsedQuestion) {
            // 2. Parse LLM JSON
            let cleaned = response.trim();
            if (cleaned.startsWith("```")) {
              cleaned = cleaned
                .replace(/^```(?:json)?/gi, "")
                .replace(/```$/gi, "")
                .trim();
            }
            const parsed = JSON.parse(cleaned);

            const answerVal =
              parsed.correctAnswer ||
              parsed.answer ||
              parsed.correct_answer ||
              parsed.correctOption ||
              parsed.correct_option ||
              "";

            // Map parsed keys to standard GeneratedQuestionDto
            parsedQuestion = {
              question: parsed.question,
              options: parsed.options || [],
              correctAnswer: answerVal,
              answer: answerVal,
              explanation: parsed.explanation,
              difficulty: parsed.difficulty || difficulty,
              topic: parsed.topic || topic,
              metadata: {
                ...(parsed.metadata || {}),
                templateId: template.id,
                variables:
                  (template as any)?.generationStrategy === "VARIABLE"
                    ? attemptVariables
                    : variableValues,
                generationStrategy: template.generationStrategy,
                datasetGenerationMode: "AI",
                datasetItem: options?.datasetItem,
                logicalGraph: options?.logicalGraph,
                isAiGenerated: true,
                generationSource: "AI_LLM_MODEL",
                isFallbackDatasetFetch: false,
              },
            };
          }
        }

        if ((template as any)?.generationStrategy === "VARIABLE") {
          const rawQTemplate = String(
            (template.structure &&
              (template.structure.questionTemplate ||
                template.structure.questionStatement ||
                template.structure.prompt)) ||
              "",
          );
          const hasPlaceholders = /\{\{[^{}]+\}\}|\{[^{}]+\}/.test(rawQTemplate);
          const hasVars = Object.keys(attemptVariables || {}).length > 0;

          if (hasPlaceholders && hasVars) {
            const canonical = this.hydrateCanonicalQuestion(
              template,
              attemptVariables,
            );
            if (canonical && canonical.trim().length > 0) {
              parsedQuestion.question = canonical;
            }
          }
        }

        parsedQuestion = normalizeDisplayQuestion(parsedQuestion);

        // 3. Process & Shuffle options
        const qType = String(template.questionType || "").toLowerCase();
        const hasOptions =
          Array.isArray(parsedQuestion.options) &&
          parsedQuestion.options.length > 0;

        if (
          qType === "mcq" ||
          qType === "multiple_choice" ||
          qType === "mcqs" ||
          qType === "msq" ||
          hasOptions
        ) {
          const processed = this.optionGenerator.processOptions(
            parsedQuestion.options || [],
            parsedQuestion.correctAnswer!,
            template.questionType || "MCQ",
          );
          parsedQuestion.options = processed.shuffledOptions;
          parsedQuestion.correctAnswer = processed.normalizedCorrectAnswer;
          parsedQuestion.answer = processed.normalizedCorrectAnswer;
        } else {
          parsedQuestion.options = [];
        }

        // 4. Validate structured explanation
        const isDirect =
          parsedQuestion.metadata?.isDirectDatasetFetch ||
          parsedQuestion.metadata?.datasetGenerationMode === "DIRECT";

        if (!isDirect) {
          this.explanationGenerator.validateExplanation(
            parsedQuestion.explanation,
            parsedQuestion.correctAnswer!,
          );

          // 5. Run response validator (leak checks, template alignment, schema validity)
          this.responseValidator.validate(
            parsedQuestion,
            difficulty,
            topic,
            template,
          );
        }

        // 5b. Run duplicate check (Task Group 5)
        if (!isDirect) {
          const dupResult =
            await this.duplicateDetector.checkDuplicate(parsedQuestion);
          if (dupResult.duplicate) {
            // Record the duplicate text so the next attempt can avoid it
            attemptAvoidQuestions.push(parsedQuestion.question || "");

            // For DATASET+AI strategy: reload a DIFFERENT dataset item so next attempt
            // generates a question from different source material.
            // Pass triedDatasetItemIds so the loader skips all previously-used items.
            const isDatasetAI =
              (template as any)?.generationStrategy === "DATASET" &&
              datasetGenerationMode === "AI" &&
              template.id;
            if (isDatasetAI) {
              try {
                // Record the current item as tried before reloading
                if (currentDatasetItem?.id && !triedDatasetItemIds.includes(currentDatasetItem.id)) {
                  triedDatasetItemIds.push(currentDatasetItem.id);
                }
                const freshItem = await this.datasetLoader.loadDatasetItem(
                  template as any,
                  triedDatasetItemIds,
                );
                // Only switch if we actually got a DIFFERENT item
                if (freshItem?.id && freshItem.id !== currentDatasetItem?.id) {
                  currentDatasetItem = freshItem;
                  triedDatasetItemIds.push(freshItem.id);
                  this.logger.log(
                    `[GenerationAudit] [Attempt ${attempts}/${maxAttempts}] Duplicate detected — resampled new dataset item ID: ${freshItem.id}`,
                  );
                } else {
                  this.logger.warn(
                    `[GenerationAudit] [Attempt ${attempts}/${maxAttempts}] Duplicate detected — no different dataset item available, retrying with same item`,
                  );
                }
              } catch {
                // Non-blocking — if reload fails, keep the existing item
              }
            }

            throw new BadRequestException(
              `Duplicate question detected in pool (similarity: ${dupResult.similarity.toFixed(2)}).`,
            );
          }
        }

        // 5c. Run quality scorer (Task Group 7)
        let cachedQualityScore: number | undefined;
        if (!isDirect) {
          const qScore = await this.qualityScorer.score(
            parsedQuestion,
            topic,
            difficulty,
          );
          if (qScore.status === "FAIL") {
            throw new BadRequestException(
              `Quality threshold check failed (Score: ${qScore.score}): ${qScore.reasons.join("; ")}`,
            );
          }
          cachedQualityScore = qScore.score;
        }

        this.logger.log(
          `[GenerationAudit] [Attempt ${attempts}/${maxAttempts}] Question successfully generated and passed all validations.`,
        );
        validationSuccess = true;
      } catch (e: any) {
        if (e instanceof TemplateGenerationException) {
          e.templateId = template?.id;
          const res = typeof e.getResponse === "function" ? (e.getResponse() as any) : {};
          if (typeof res === "object" && res !== null) res.template_id = template?.id;
          throw e;
        }
        if (e instanceof PreviewGenerationException) {
          throw e;
        }

        const classified = this.classifyPreviewFailure(e, "generation-retry");
        attemptErrors.push(classified.reason);
        allAttemptErrors.push(classified.reason);

        this.logger.warn(
          `[GenerationAudit] [Attempt ${attempts}/${maxAttempts}] Validation failed: ${classified.reason} | Category: ${classified.category} | Retryable: ${classified.retryable}`,
        );

        if (!classified.retryable) {
          throw new PreviewGenerationException(
            classified.message,
            classified.details,
          );
        }
      }

      // 6. Calculate quality score for log (reusing cached score to avoid duplicate async execution)
      let finalScore = 0.0;
      if (validationSuccess && parsedQuestion) {
        const isDirect =
          parsedQuestion.metadata?.isDirectDatasetFetch ||
          parsedQuestion.metadata?.datasetGenerationMode === "DIRECT";
        if (isDirect) {
          finalScore = 100.0;
        } else if (cachedQualityScore !== undefined) {
          finalScore = cachedQualityScore;
        } else {
          try {
            const qScore = await this.qualityScorer.score(
              parsedQuestion,
              topic,
              difficulty,
            );
            finalScore = qScore.score;
          } catch {
            finalScore = 100.0;
          }
        }
      }

      // Save audit logs asynchronously (non-blocking)
      try {
        const logPromise = this.auditService.log({
          prompt: promptStr,
          response: response || "ERROR",
          qualityScore: finalScore,
          validationResult: {
            success: validationSuccess,
            attempt: attempts,
            errors: attemptErrors,
          },
        });
        if (logPromise && typeof logPromise.catch === "function") {
          logPromise.catch((logErr) => {
            this.logger.warn("Auditing log persistence error:", logErr);
          });
        }
      } catch {
        // Non-blocking telemetry
      }

      if (validationSuccess && parsedQuestion) {
        return {
          attempts,
          success: true,
          question: parsedQuestion,
        };
      }

      errors.push(`Attempt ${attempts} failed: ${attemptErrors.join("; ")}`);
    }

    return {
      attempts,
      success: false,
      errors,
    };
  }

  private classifyPreviewFailure(
    error: unknown,
    source: string,
  ): {
    message: string;
    retryable: boolean;
    category: string;
    reason: string;
    details: PreviewErrorDetails;
  } {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const reason = rawMessage.replace(/^Error:\s*/i, "").trim();
    const lower = reason.toLowerCase();

    const nonRetryablePatterns = [
      "unknown variable",
      "undefined variable",
      "undefined symbol",
      "invalid formula",
      "unresolved template placeholder",
      "placeholder tokens",
      "constraint violation",
      "circular dependency",
    ];

    const retryablePatterns = [
      "timeout",
      "rate limit",
      "temporarily unavailable",
      "network",
      "econnreset",
      "fetch",
      "service unavailable",
      "429",
      "502",
      "503",
      "504",
      // Content-level: allow retries so AI can generate a fresh unique question
      "duplicate question",
      "quality threshold",
      "validation failed",
      "topic alignment check",
      "difficulty mismatch",
      "math validation failed",
      // Explanation format errors — AI can self-correct on retry
      "explanation is missing",
      "explanation alignment",
      "section headings",
      "missing required section",
      "mcq options",
      "duplicate entries",
      "options list must contain",
      "correctanswer",
      "correct answer",
    ];

    const isNonRetryable = nonRetryablePatterns.some((pattern) =>
      lower.includes(pattern),
    );
    // Retryable check takes precedence over non-retryable for content-level errors
    const isRetryable = retryablePatterns.some((pattern) =>
      lower.includes(pattern),
    );

    // isRetryable takes priority: if the AI produced bad content (format, options, duplicates),
    // it should always get a retry chance even if the message accidentally matches a non-retryable keyword.
    if (isRetryable) {
      return {
        message: "AI service temporarily unavailable.",
        retryable: true,
        category: "AI_SERVICE_ERROR",
        reason,
        details: {
          category: "AI_SERVICE_ERROR",
          retryable: true,
          source,
          reason,
          context: { originalError: reason },
        },
      };
    }

    if (isNonRetryable) {
      const category =
        lower.includes("placeholder") || lower.includes("template")
          ? "TEMPLATE_CONFIGURATION_ERROR"
          : lower.includes("invalid formula") ||
              lower.includes("variable") ||
              lower.includes("constraint violation")
            ? "FORMULA_ERROR"
            : "CONTENT_VALIDATION_ERROR";

      return {
        message: "Template configuration error.",
        retryable: false,
        category,
        reason,
        details: {
          category,
          retryable: false,
          source,
          reason,
          context: { originalError: reason },
        },
      };
    }

    if (isRetryable) {
      return {
        message: "AI service temporarily unavailable.",
        retryable: true,
        category: "AI_SERVICE_ERROR",
        reason,
        details: {
          category: "AI_SERVICE_ERROR",
          retryable: true,
          source,
          reason,
          context: { originalError: reason },
        },
      };
    }

    return {
      message: "Preview generation failed.",
      retryable: true,
      category: "MODEL_OUTPUT_ERROR",
      reason,
      details: {
        category: "MODEL_OUTPUT_ERROR",
        retryable: true,
        source,
        reason,
        context: { originalError: reason },
      },
    };
  }

  private hydrateCanonicalQuestion(
    template: any,
    variables: Record<string, unknown>,
  ): string {
    const questionTemplate =
      (template.structure &&
        (template.structure.questionTemplate ||
          template.structure.questionStatement ||
          template.structure.prompt)) ||
      "";

    return String(questionTemplate)
      .replace(/\{\{([^{}]+)\}\}/g, (match, key, offset, text) => {
        const trimmed = key.trim();
        return Object.prototype.hasOwnProperty.call(variables, trimmed)
          ? formatInterpolatedDisplayValue(text, offset, variables[trimmed])
          : match;
      })
      .replace(/\{([^{}]+)\}/g, (match, key, offset, text) => {
        const trimmed = key.trim();
        return Object.prototype.hasOwnProperty.call(variables, trimmed)
          ? formatInterpolatedDisplayValue(text, offset, variables[trimmed])
          : match;
      });
  }
}
