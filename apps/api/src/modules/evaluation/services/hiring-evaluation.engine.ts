import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { HiringStrategyRegistry } from "../strategies/hiring-strategy.registry";
import {
  HiringEvaluationContext,
  SectionScoreContext,
  QuestionEvalContext,
  CodingEvalContext,
} from "../strategies/hiring-evaluation-strategy.interface";
import { HiringEvaluationResultDto } from "@intervu-ai/contracts";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class HiringEvaluationEngine {
  private readonly logger = new AppLogger({ name: "HiringEvaluationEngine" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyRegistry: HiringStrategyRegistry,
  ) {}

  /**
   * Evaluates hiring qualification for a given test attempt if enabled in assessment config.
   * Returns null if hiring evaluation is disabled or not configured.
   */
  async evaluateAttempt(
    attemptId: string,
    sectionScores: SectionScoreContext[],
    objectiveEvalResults: QuestionEvalContext[],
    codingEvalResults: CodingEvalContext[],
  ): Promise<HiringEvaluationResultDto | null> {
    // 1. Fetch test instance to identify linked examConfigId
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      select: { id: true, examConfigId: true, testConfigId: true },
    });

    const configId = testInstance?.examConfigId || testInstance?.testConfigId;
    if (!configId) {
      this.logger.debug("No assessment config ID associated with attempt", { attemptId });
      return null;
    }

    // 2. Fetch HiringEvaluationConfig and relational section mappings
    const hiringConfig = await (this.prisma as any).hiringEvaluationConfig.findUnique({
      where: { examConfigId: configId },
      include: { sectionMappings: true },
    });

    if (!hiringConfig || !hiringConfig.enabled) {
      this.logger.debug("Hiring evaluation is disabled or not configured", { attemptId, configId });
      return null;
    }

    this.logger.info("Executing hiring evaluation strategy", {
      attemptId,
      strategy: hiringConfig.strategy,
    });

    // 3. Resolve strategy implementation
    const strategy = this.strategyRegistry.getStrategy(hiringConfig.strategy);

    // 4. Construct context
    const context: HiringEvaluationContext = {
      config: {
        id: hiringConfig.id,
        examConfigId: hiringConfig.examConfigId,
        strategy: hiringConfig.strategy,
        enabled: hiringConfig.enabled,
        ninjaThreshold: hiringConfig.ninjaThreshold,
        digitalThreshold: hiringConfig.digitalThreshold,
        primeThreshold: hiringConfig.primeThreshold,
        advancedDigitalMin: hiringConfig.advancedDigitalMin,
        advancedPrimeMin: hiringConfig.advancedPrimeMin,
        codingTotalProblems: hiringConfig.codingTotalProblems,
        codingDigitalMinSolved: hiringConfig.codingDigitalMinSolved,
        codingPrimeMinSolved: hiringConfig.codingPrimeMinSolved,
        sectionMappings: hiringConfig.sectionMappings.map((m: any) => ({
          sectionCode: m.sectionCode,
          sectionName: m.sectionName,
          mappingType: m.mappingType,
          minimumCorrectAnswers: m.minimumCorrectAnswers,
        })),
      },
      sectionScores,
      objectiveEvalResults,
      codingEvalResults,
    };

    // 5. Run strategy
    const result = await strategy.evaluate(context);
    this.logger.info("Hiring evaluation completed", {
      attemptId,
      qualification: result.qualification,
      reason: result.qualificationReason,
    });

    return result;
  }
}
