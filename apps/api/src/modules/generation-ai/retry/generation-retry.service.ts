import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
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

export interface RetryResult {
  attempts: number;
  success: boolean;
  question?: GeneratedQuestionDto;
  errors?: string[];
}

@Injectable()
export class GenerationRetryService {
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
      } catch {
        variableValues = {};
      }
    }

    return this.generateFromTemplate(
      templateData,
      variableValues,
      maxAttempts,
      { datasetItem, logicalGraph },
    );
  }

  /**
   * Compiles dynamic prompt, runs generation and full multi-stage validation checks.
   */
  async generateFromTemplate(
    template: any,
    variableValues: Record<string, unknown>,
    maxAttempts: number = 3,
    options?: { datasetItem?: any; logicalGraph?: any; correctAnswer?: string },
  ): Promise<RetryResult> {
    let attempts = 0;
    const errors: string[] = [];

    // Fetch custom prompt configuration if strategy is DATASET
    let promptConfig: any = undefined;
    if (template.id && (template.generationStrategy === "DATASET" || (template as any).strategy === "DATASET")) {
      promptConfig = await this.prisma.templatePromptConfig.findUnique({
        where: { templateId: template.id },
      });
    }

    // Resolve styleProfile from options or load default
    let styleProfile = (options as any)?.styleProfile;
    if (!styleProfile) {
      styleProfile = await this.prisma.styleProfile.findFirst({
        where: { isDefault: true, active: true },
      });
    }

    // Compile dynamic structured prompt
    const prompt = this.promptBuilder.buildPrompt({
      template,
      variableValues,
      correctAnswer: options?.correctAnswer,
      datasetItem: options?.datasetItem,
      logicalGraph: options?.logicalGraph,
      promptConfig: promptConfig || undefined,
      styleProfile,
    });

    const difficulty = template.difficultyLevel.toLowerCase();
    const topic = template.conceptKey;

    while (attempts < maxAttempts) {
      attempts++;
      let response = "";
      let parsedQuestion: GeneratedQuestionDto | undefined;
      let validationSuccess = false;
      const attemptErrors: string[] = [];

      try {
        // 1. Generate LLM Output
        response = await this.questionGenerator.generate(prompt);

        // 2. Parse LLM JSON
        let cleaned = response.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned
            .replace(/^```(?:json)?/gi, "")
            .replace(/```$/gi, "")
            .trim();
        }
        const parsed = JSON.parse(cleaned);

        // Map parsed keys to standard GeneratedQuestionDto
        parsedQuestion = {
          question: parsed.question,
          options: parsed.options || [],
          correctAnswer: parsed.correctAnswer || parsed.answer,
          answer: parsed.correctAnswer || parsed.answer,
          explanation: parsed.explanation,
          difficulty: parsed.difficulty || difficulty,
          topic: parsed.topic || topic,
          metadata: {
            ...(parsed.metadata || {}),
            templateId: template.id,
            variables: variableValues,
            generationStrategy: template.generationStrategy,
            datasetItem: options?.datasetItem,
            logicalGraph: options?.logicalGraph,
          },
        };

        // 3. Process & Shuffle options
        if (
          template.questionType === "mcq" ||
          template.questionType === "multiple_choice"
        ) {
          const processed = this.optionGenerator.processOptions(
            parsedQuestion.options || [],
            parsedQuestion.correctAnswer!,
            template.questionType,
          );
          parsedQuestion.options = processed.shuffledOptions;
          parsedQuestion.correctAnswer = processed.normalizedCorrectAnswer;
          parsedQuestion.answer = processed.normalizedCorrectAnswer;
        } else {
          parsedQuestion.options = [];
        }

        // 4. Validate structured explanation
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

        // 5b. Run duplicate check (Task Group 5)
        const dupResult =
          await this.duplicateDetector.checkDuplicate(parsedQuestion);
        if (dupResult.duplicate) {
          throw new BadRequestException(
            `Duplicate question detected in pool (similarity: ${dupResult.similarity.toFixed(2)}).`,
          );
        }

        // 5c. Run quality scorer (Task Group 7)
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

        validationSuccess = true;
      } catch (e: any) {
        attemptErrors.push(e.message || String(e));
      }

      // 6. Calculate quality score for log
      let finalScore = 0.0;
      if (validationSuccess && parsedQuestion) {
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

      // Save audit logs
      try {
        await this.auditService.log({
          prompt,
          response: response || "ERROR",
          qualityScore: finalScore,
          validationResult: {
            success: validationSuccess,
            attempt: attempts,
            errors: attemptErrors,
          },
        });
      } catch (logErr) {
        console.error("Auditing log persistence error:", logErr);
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
}
