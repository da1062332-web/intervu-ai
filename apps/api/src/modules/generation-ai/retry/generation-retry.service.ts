import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { LLMAdapter } from "../adapters/llm-adapter.interface";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { generateCodingPrompt } from "../prompts/coding.prompt";
import { generateLogicalPrompt } from "../prompts/logical.prompt";
import { generateQuantitativePrompt } from "../prompts/quantitative.prompt";
import { generateVerbalPrompt } from "../prompts/verbal.prompt";
import { QuestionQualityService } from "../scorers/question-quality.service";
import { GenerationAuditService } from "../services/generation-audit.service";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { DuplicateDetectorService } from "../validators/duplicate-detector.service";
import { ResponseParserService } from "../validators/response-parser.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";

export interface RetryResult {
  attempts: number;
  success: boolean;
  question?: GeneratedQuestionDto;
  errors?: string[];
}

@Injectable()
export class GenerationRetryService {
  constructor(
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
    private readonly responseParser: ResponseParserService,
    private readonly qualityScorer: QuestionQualityService,
    private readonly topicValidator: TopicAlignmentService,
    private readonly difficultyValidator: DifficultyValidatorService,
    private readonly duplicateDetector: DuplicateDetectorService,
    private readonly auditService: GenerationAuditService,
  ) {}

  async generateWithRetry(
    category: "quantitative" | "logical" | "verbal" | "coding",
    topic: string,
    difficulty: string,
    maxAttempts: number = 3,
  ): Promise<RetryResult> {
    let attempts = 0;
    const errors: string[] = [];

    // 1. Select the correct prompt template
    let prompt = "";
    if (category === "quantitative") {
      prompt = generateQuantitativePrompt(topic, difficulty);
    } else if (category === "logical") {
      prompt = generateLogicalPrompt(topic, difficulty);
    } else if (category === "verbal") {
      prompt = generateVerbalPrompt(topic, difficulty);
    } else if (category === "coding") {
      prompt = generateCodingPrompt(topic, difficulty);
    } else {
      throw new BadRequestException(`Invalid category: ${category}`);
    }

    while (attempts < maxAttempts) {
      attempts++;
      let response = "";
      let parsedQuestion: GeneratedQuestionDto | undefined;
      let scoreResult: any = null;
      let validationSuccess = false;
      const attemptErrors: string[] = [];

      try {
        // 2. Generate response from LLM
        response = await this.llmAdapter.generate(prompt);

        // 3. Parse LLM response
        parsedQuestion = await this.responseParser.parse(response);

        // 4. Run validators individually for granular validation logging
        const topicResult = await this.topicValidator.validate(
          parsedQuestion,
          topic,
        );
        if (!topicResult.match) {
          attemptErrors.push(
            `Topic mismatch: expected "${topic}" but got "${parsedQuestion.topic}"`,
          );
        }

        const diffResult = await this.difficultyValidator.validate(
          parsedQuestion,
          difficulty,
        );
        if (!diffResult) {
          attemptErrors.push(
            `Difficulty mismatch: expected "${difficulty}" but got "${parsedQuestion.difficulty}"`,
          );
        }

        const duplicateResult =
          await this.duplicateDetector.checkDuplicate(parsedQuestion);
        if (duplicateResult.duplicate) {
          attemptErrors.push(
            `Duplicate detected with similarity: ${duplicateResult.similarity}`,
          );
        }

        // 5. Compute quality score
        scoreResult = await this.qualityScorer.score(
          parsedQuestion,
          topic,
          difficulty,
        );

        validationSuccess =
          topicResult.match &&
          diffResult &&
          !duplicateResult.duplicate &&
          scoreResult.status === "PASS";

        if (!validationSuccess) {
          attemptErrors.push(...scoreResult.reasons);
        }
      } catch (e: any) {
        attemptErrors.push(`Attempt error: ${e.message}`);
        scoreResult = { score: 0, status: "FAIL", reasons: [e.message] };
      }

      // 6. Save audit trace to the DB
      try {
        await this.auditService.log({
          prompt,
          response: response || "ERROR",
          qualityScore: scoreResult ? scoreResult.score : 0.0,
          validationResult: {
            success: validationSuccess,
            attempt: attempts,
            errors: attemptErrors,
            qualityDetails: scoreResult,
          },
        });
      } catch (logError) {
        console.error("Auditing log failed to persist:", logError);
      }

      if (validationSuccess && parsedQuestion) {
        return {
          attempts,
          success: true,
          question: parsedQuestion,
        };
      }

      errors.push(`Attempt ${attempts} failed: ${attemptErrors.join(", ")}`);
    }

    return {
      attempts,
      success: false,
      errors,
    };
  }
}
