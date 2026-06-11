import { ExecutionResult, EvaluationResultDto } from "@intervu-ai/contracts";
import { randomUUID } from "crypto";
import {
  QuestionSnapshot,
  ScoreCalculatorService,
} from "./score-calculator.service";
import { SkillEvaluatorService } from "./skill-evaluator.service";
import { FeedbackGeneratorService } from "./feedback-generator.service";
import { EvaluationValidatorService } from "./evaluation-validator.service";

export class EvaluationEngineService {
  private readonly scoreCalculator: ScoreCalculatorService;
  private readonly skillEvaluator: SkillEvaluatorService;
  private readonly feedbackGenerator: FeedbackGeneratorService;
  private readonly validator: EvaluationValidatorService;

  constructor(
    scoreCalculator?: ScoreCalculatorService,
    skillEvaluator?: SkillEvaluatorService,
    feedbackGenerator?: FeedbackGeneratorService,
    validator?: EvaluationValidatorService,
  ) {
    this.scoreCalculator = scoreCalculator || new ScoreCalculatorService();
    this.skillEvaluator = skillEvaluator || new SkillEvaluatorService();
    this.feedbackGenerator =
      feedbackGenerator || new FeedbackGeneratorService();
    this.validator = validator || new EvaluationValidatorService();
  }

  /**
   * Orchestrates the evaluation of a single candidate test execution.
   */
  async evaluate(
    executionResult: ExecutionResult,
    questions: QuestionSnapshot[],
  ): Promise<EvaluationResultDto> {
    // 1. Validate Input
    const inputValidation = this.validator.validateInput(
      executionResult,
      questions.length,
    );
    if (!inputValidation.isValid) {
      throw new Error(
        `Evaluation input validation failed: ${inputValidation.errors.join(", ")}`,
      );
    }

    // 2. Map questions for easy lookup
    const questionsMap: Record<string, QuestionSnapshot> = {};
    for (const q of questions) {
      questionsMap[q.questionId] = q;
    }

    // 3. Compute Score and correctness breakdown
    const scoreResult = this.scoreCalculator.calculateScore(
      executionResult.answers,
      questionsMap,
    );

    // 4. Evaluate Skill Scores
    const skillScores = this.skillEvaluator.evaluateSkills(
      questionsMap,
      scoreResult.breakdown,
    );

    // 5. Generate Feedback
    const feedback = this.feedbackGenerator.generateFeedback(
      questionsMap,
      scoreResult.breakdown,
    );

    // 6. Calculate Confidence Score
    const totalQuestions = questions.length;
    const answeredCount = executionResult.answers.filter(
      (a) => a.answer && a.answer.trim() !== "",
    ).length;
    const confidenceScore =
      totalQuestions > 0
        ? Math.round((answeredCount / totalQuestions) * 100)
        : 0;

    // 7. Construct Evaluation Result DTO
    const evaluationResult: EvaluationResultDto = {
      evaluationId: `eval_${randomUUID()}`,
      overallScore: scoreResult.overallScore,
      confidenceScore,
      skillScores,
      feedback,
      evaluatedAt: new Date(),
    };

    // 8. Validate Output
    const outputValidation = this.validator.validateResult(evaluationResult);
    if (!outputValidation.isValid) {
      throw new Error(
        `Evaluation output validation failed: ${outputValidation.errors.join(", ")}`,
      );
    }

    return evaluationResult;
  }

  /**
   * Evaluates multiple test executions in bulk for analytics and performance pipelines.
   * Efficiently processes items to support SLAs.
   */
  async evaluateBatch(
    executionResults: ExecutionResult[],
    questionsMap: Record<string, QuestionSnapshot[]>,
  ): Promise<EvaluationResultDto[]> {
    if (!executionResults || !Array.isArray(executionResults)) {
      return [];
    }

    const evaluations: EvaluationResultDto[] = [];
    for (const execResult of executionResults) {
      // Find matching questions using testId or executionId as the key
      const questions =
        questionsMap[execResult.testId] ||
        questionsMap[execResult.executionId] ||
        [];

      const evaluation = await this.evaluate(execResult, questions);
      evaluations.push(evaluation);
    }

    return evaluations;
  }
}
