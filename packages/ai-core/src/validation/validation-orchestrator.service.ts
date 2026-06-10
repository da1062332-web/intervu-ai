import {
  GeneratedQuestionDto,
  QuestionValidationDto,
  ValidationErrorDetail,
} from "@intervu-ai/contracts";
import { QuestionValidatorService } from "./question-validator.service";
import { AnswerValidatorService } from "./answer-validator.service";
import { DifficultyValidatorService } from "./difficulty-validator.service";
import { AmbiguityValidatorService } from "./ambiguity-validator.service";
import { QualityValidatorService } from "./quality-validator.service";
import { VALIDATION_RULES } from "./rules/validation-rules";

export class ValidationOrchestratorService {
  private readonly structureValidator: QuestionValidatorService;
  private readonly answerValidator: AnswerValidatorService;
  private readonly difficultyValidator: DifficultyValidatorService;
  private readonly ambiguityValidator: AmbiguityValidatorService;
  private readonly qualityValidator: QualityValidatorService;

  constructor(
    structureValidator?: QuestionValidatorService,
    answerValidator?: AnswerValidatorService,
    difficultyValidator?: DifficultyValidatorService,
    ambiguityValidator?: AmbiguityValidatorService,
    qualityValidator?: QualityValidatorService,
  ) {
    this.structureValidator =
      structureValidator || new QuestionValidatorService();
    this.answerValidator = answerValidator || new AnswerValidatorService();
    this.difficultyValidator =
      difficultyValidator || new DifficultyValidatorService();
    this.ambiguityValidator =
      ambiguityValidator || new AmbiguityValidatorService();
    this.qualityValidator = qualityValidator || new QualityValidatorService();
  }

  /**
   * Orchestrates the 5-stage validation process.
   * Method conforms to standard backend rules.
   */
  validateQuestion(question: GeneratedQuestionDto): QuestionValidationDto {
    // 1. Run all validators
    const structRes = this.structureValidator.validateStructure(question);
    const answerRes = this.answerValidator.validateAnswer(question);
    const diffRes = this.difficultyValidator.validateDifficulty(question);
    const ambRes = this.ambiguityValidator.validateAmbiguity(question);
    const qualRes = this.qualityValidator.validateQuality(question);

    // 2. Sum the scores (If structure validation fails, the entire question is invalid, so score is 0)
    const totalScore = structRes.passed
      ? structRes.score +
        answerRes.score +
        diffRes.score +
        ambRes.score +
        qualRes.score
      : 0;

    // 3. Collect errors and warnings
    const errors: ValidationErrorDetail[] = [
      ...structRes.errors,
      ...answerRes.errors,
      ...diffRes.errors,
      ...ambRes.errors,
      ...qualRes.errors,
    ];

    const warnings: string[] = [
      ...structRes.warnings,
      ...answerRes.warnings,
      ...diffRes.warnings,
      ...ambRes.warnings,
      ...qualRes.warnings,
    ];

    // 4. Calculate pass status (All stages must pass AND score must be >= 80)
    const passed =
      structRes.passed &&
      answerRes.passed &&
      diffRes.passed &&
      ambRes.passed &&
      qualRes.passed &&
      totalScore >= VALIDATION_RULES.PASSING_SCORE;

    // Add scoring failure if score < PASSING_SCORE but no other errors were added
    if (!passed && errors.length === 0) {
      errors.push({
        code: "VALIDATION_SCORE_FAIL",
        reason: `Validation score is ${totalScore}, which is below the passing threshold of ${VALIDATION_RULES.PASSING_SCORE}.`,
      });
    }

    return {
      questionId: question.questionId || "unknown",
      isValid: passed, // Keep for backward compatibility
      passed,
      score: totalScore,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Bulk validation support for multiple questions.
   */
  validateQuestions(
    questions: GeneratedQuestionDto[],
  ): QuestionValidationDto[] {
    if (!questions || !Array.isArray(questions)) {
      return [];
    }
    return questions.map((q) => this.validateQuestion(q));
  }
}
