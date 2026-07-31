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
    // 1. Fetch test instance to identify linked examConfigId / testConfig
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        examConfig: {
          include: { hiringEvaluationConfig: { include: { sectionMappings: true } } },
        },
        testConfig: true,
      },
    });

    if (!testInstance) {
      this.logger.debug("Test instance not found", { attemptId });
      return null;
    }

    let hiringConfig: any = null;
    let foundExplicitConfig = false;

    // A. Check directly linked ExamConfig on TestInstance
    if (testInstance.examConfig?.hiringEvaluationConfig) {
      hiringConfig = testInstance.examConfig.hiringEvaluationConfig;
      foundExplicitConfig = true;
    }

    // B. Check by testInstance.examConfigId
    if (!hiringConfig && testInstance.examConfigId) {
      hiringConfig = await (this.prisma as any).hiringEvaluationConfig.findUnique({
        where: { examConfigId: testInstance.examConfigId },
        include: { sectionMappings: true },
      });
      if (hiringConfig) foundExplicitConfig = true;
    }

    // C. Check via AssembledTest linked configId
    if (!hiringConfig) {
      const assembledTest = await this.prisma.assembledTest.findFirst({
        where: {
          OR: [
            { id: attemptId },
            ...(testInstance.testConfigId ? [{ id: testInstance.testConfigId }] : []),
            ...(testInstance.testConfigId ? [{ configId: testInstance.testConfigId }] : []),
          ],
        },
        include: {
          examConfig: {
            include: { hiringEvaluationConfig: { include: { sectionMappings: true } } },
          },
        },
      });

      if (assembledTest?.examConfig?.hiringEvaluationConfig) {
        hiringConfig = assembledTest.examConfig.hiringEvaluationConfig;
        foundExplicitConfig = true;
      } else if (assembledTest?.configId) {
        hiringConfig = await (this.prisma as any).hiringEvaluationConfig.findUnique({
          where: { examConfigId: assembledTest.configId },
          include: { sectionMappings: true },
        });
        if (hiringConfig) foundExplicitConfig = true;
      }
    }

    // D. Check by testInstance.testConfigId
    if (!hiringConfig && testInstance.testConfigId) {
      hiringConfig = await (this.prisma as any).hiringEvaluationConfig.findUnique({
        where: { examConfigId: testInstance.testConfigId },
        include: { sectionMappings: true },
      });
      if (hiringConfig) foundExplicitConfig = true;
    }

    // If an explicit config was found for this assessment and it is DISABLED (enabled = false), STOP and return null!
    if (foundExplicitConfig && hiringConfig && !hiringConfig.enabled) {
      this.logger.debug("Hiring evaluation is explicitly disabled for this assessment", {
        attemptId,
        examConfigId: hiringConfig.examConfigId,
      });
      return null;
    }

    // E. Fallback: Only match global enabled config if attempt is a TCS/TCS-NQT exam and has no custom config record
    if (!hiringConfig && !foundExplicitConfig) {
      const isTcsExam =
        testInstance.testConfig?.displayName?.toUpperCase().includes("TCS") ||
        testInstance.testConfig?.companyName?.toUpperCase().includes("TCS") ||
        testInstance.examConfig?.name?.toUpperCase().includes("TCS");

      if (isTcsExam) {
        hiringConfig = await (this.prisma as any).hiringEvaluationConfig.findFirst({
          where: { enabled: true },
          include: { sectionMappings: true },
          orderBy: { updatedAt: "desc" },
        });
      }
    }

    if (!hiringConfig || !hiringConfig.enabled) {
      this.logger.debug("Hiring evaluation is disabled or not configured", { attemptId });
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
