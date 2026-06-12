import {
  EvaluationResultDto,
  RecommendationDto,
  RecommendationResultDto,
} from "@intervu-ai/contracts";
import { SkillGapAnalyzerService } from "./skill-gap-analyzer.service";
import { RecommendationGeneratorService } from "./recommendation-generator.service";
import { ImprovementPathService } from "./improvement-path.service";
import { RecommendationValidatorService } from "./recommendation-validator.service";

export class RecommendationEngineService {
  private readonly gapAnalyzer: SkillGapAnalyzerService;
  private readonly generator: RecommendationGeneratorService;
  private readonly improvementPath: ImprovementPathService;
  private readonly validator: RecommendationValidatorService;

  constructor(
    gapAnalyzer?: SkillGapAnalyzerService,
    generator?: RecommendationGeneratorService,
    improvementPath?: ImprovementPathService,
    validator?: RecommendationValidatorService
  ) {
    this.gapAnalyzer = gapAnalyzer || new SkillGapAnalyzerService();
    this.generator = generator || new RecommendationGeneratorService();
    this.improvementPath = improvementPath || new ImprovementPathService();
    this.validator = validator || new RecommendationValidatorService();
  }

  /**
   * Generates prioritized study recommendations for a candidate based on their evaluation results.
   */
  async generateRecommendations(
    evaluation: EvaluationResultDto
  ): Promise<RecommendationResultDto> {
    if (!evaluation) {
      throw new Error("Evaluation result is required.");
    }

    // 1. Analyze gaps
    const gapResult = this.gapAnalyzer.analyzeGaps(evaluation);

    const recommendations: RecommendationDto[] = [];

    // 2. Process weak skills (HIGH/MEDIUM priority)
    for (const skill of gapResult.weakSkills) {
      const score = gapResult.scores[skill] ?? 40;
      const rec = this.generator.generate(skill, score);
      if (rec) recommendations.push(rec);
    }

    // 3. Process weak concepts (HIGH/MEDIUM priority)
    for (const concept of gapResult.weakConcepts) {
      const score = gapResult.scores[concept] ?? 40;
      const rec = this.generator.generate(concept, score);
      if (rec) recommendations.push(rec);
    }

    // 4. Process strong skills (LOW priority)
    for (const skill of gapResult.strongSkills) {
      const score = gapResult.scores[skill] ?? 85;
      const rec = this.generator.generate(skill, score);
      if (rec) recommendations.push(rec);
    }

    // 5. Process strong concepts (LOW priority)
    for (const concept of gapResult.strongConcepts) {
      const score = gapResult.scores[concept] ?? 85;
      const rec = this.generator.generate(concept, score);
      if (rec) recommendations.push(rec);
    }

    // 6. Apply priority sorting (HIGH -> MEDIUM -> LOW)
    const sortedRecommendations = this.improvementPath.createPath(recommendations);

    const result: RecommendationResultDto = {
      recommendations: sortedRecommendations,
    };

    // 7. Validate output
    const validation = this.validator.validate(result);
    if (!validation.isValid) {
      throw new Error(
        `Recommendation validation failed: ${validation.errors.join(", ")}`
      );
    }

    return result;
  }

  /**
   * Generates recommendations in bulk for multiple evaluations.
   * Keyed by the evaluationId.
   */
  async generateBatchRecommendations(
    evaluations: EvaluationResultDto[]
  ): Promise<Record<string, RecommendationResultDto>> {
    if (!evaluations || !Array.isArray(evaluations)) {
      return {};
    }

    const batchResults: Record<string, RecommendationResultDto> = {};

    for (const evalResult of evaluations) {
      const key = evalResult.evaluationId || `eval_unknown_${Math.random()}`;
      const recs = await this.generateRecommendations(evalResult);
      batchResults[key] = recs;
    }

    return batchResults;
  }
}
