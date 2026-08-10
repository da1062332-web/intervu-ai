import { Injectable } from "@nestjs/common";
import {
  IHiringEvaluationStrategy,
  HiringEvaluationContext,
} from "./hiring-evaluation-strategy.interface";
import {
  HiringEvaluationResultDto,
  SectionPassFailBreakdown,
  CodingProblemSummary,
} from "@intervu-ai/contracts";

@Injectable()
export class TcsHiringStrategy implements IHiringEvaluationStrategy {
  readonly strategyType = "TCS";

  async evaluate(
    context: HiringEvaluationContext,
  ): Promise<HiringEvaluationResultDto> {
    const { config, sectionScores, objectiveEvalResults, codingEvalResults } =
      context;

    // Helper map for section correct counts from sectionScores or objectiveEvalResults
    const sectionCorrectMap = new Map<string, number>();
    sectionScores.forEach((sec) => {
      sectionCorrectMap.set(sec.sectionKey, sec.correct);
      sectionCorrectMap.set(sec.sectionKey.toUpperCase(), sec.correct);
      if (sec.sectionName) {
        sectionCorrectMap.set(sec.sectionName, sec.correct);
        sectionCorrectMap.set(sec.sectionName.toUpperCase(), sec.correct);
      }
    });

    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, "");

    const categoryAliases: Record<string, string[]> = {
      NUMERICAL: ["numerical", "quant", "quantitative", "aptitude", "math"],
      VERBAL: ["verbal", "english", "language", "reading"],
      REASONING: ["reasoning", "logical", "analytic", "mental"],
      ADVANCED_APTITUDE: ["advanced", "advaptitude", "advquant", "complex"],
    };

    const getCorrectForSection = (
      sectionCode: string,
      sectionName?: string,
      mappingType?: string,
    ) => {
      const codeNorm = normalize(sectionCode);
      const nameNorm = sectionName ? normalize(sectionName) : "";

      // 1. Direct match or normalized match
      for (const [key, val] of sectionCorrectMap.entries()) {
        const keyNorm = normalize(key);
        if (keyNorm === codeNorm || (nameNorm && keyNorm === nameNorm)) {
          return val;
        }
      }

      // 2. Category Alias matching
      const targetCategory = mappingType || sectionCode;
      const aliases = categoryAliases[targetCategory.toUpperCase()] || [];
      for (const [key, val] of sectionCorrectMap.entries()) {
        const keyNorm = normalize(key);
        for (const alias of aliases) {
          if (keyNorm.includes(alias) || alias.includes(keyNorm)) {
            return val;
          }
        }
      }

      // 3. Partial match fallback
      for (const [key, val] of sectionCorrectMap.entries()) {
        const keyNorm = normalize(key);
        if (
          (codeNorm && keyNorm.includes(codeNorm)) ||
          (codeNorm && codeNorm.includes(keyNorm))
        ) {
          return val;
        }
      }

      return 0;
    };

    const sectionsBreakdown: SectionPassFailBreakdown[] = [];

    // Step 1: Evaluate Foundation Sections (NUMERICAL, VERBAL, REASONING)
    const foundationMappings = config.sectionMappings.filter((m) =>
      ["NUMERICAL", "VERBAL", "REASONING"].includes(m.mappingType),
    );

    let failedSectionalCutoff = false;
    let numericalScore = 0;
    let numericalMin = 0;
    let verbalScore = 0;
    let verbalMin = 0;
    let reasoningScore = 0;
    let reasoningMin = 0;

    for (const mapping of foundationMappings) {
      const correctCount = getCorrectForSection(
        mapping.sectionCode,
        mapping.sectionName || undefined,
        mapping.mappingType,
      );
      const minRequired = mapping.minimumCorrectAnswers;
      const passed = correctCount >= minRequired;

      sectionsBreakdown.push({
        category: mapping.mappingType,
        sectionCode: mapping.sectionCode,
        sectionName: mapping.sectionName || mapping.sectionCode,
        correctCount,
        requiredMin: minRequired,
        passed,
      });

      if (!passed) {
        failedSectionalCutoff = true;
      }

      if (mapping.mappingType === "NUMERICAL") {
        numericalScore += correctCount;
        numericalMin = Math.max(numericalMin, minRequired);
      } else if (mapping.mappingType === "VERBAL") {
        verbalScore += correctCount;
        verbalMin = Math.max(verbalMin, minRequired);
      } else if (mapping.mappingType === "REASONING") {
        reasoningScore += correctCount;
        reasoningMin = Math.max(reasoningMin, minRequired);
      }
    }

    const foundationTotal = numericalScore + verbalScore + reasoningScore;

    // Advanced Aptitude score calculation
    const advancedMappings = config.sectionMappings.filter(
      (m) => m.mappingType === "ADVANCED_APTITUDE",
    );
    let advancedScore = 0;
    let advancedSectionCode: string | undefined;
    for (const m of advancedMappings) {
      advancedSectionCode = m.sectionCode;
      advancedScore += getCorrectForSection(
        m.sectionCode,
        m.sectionName || undefined,
        m.mappingType,
      );
    }

    // Coding Evaluation
    const codingProblemsSummaries: CodingProblemSummary[] =
      codingEvalResults.map((c) => {
        let status: "SOLVED" | "PARTIAL" | "FAILED" = "FAILED";
        if (c.score >= 100 || c.isCorrect) {
          status = "SOLVED";
        } else if (c.score > 0) {
          status = "PARTIAL";
        }
        return {
          problemId: c.questionId,
          scorePercentage: Math.min(100, Math.max(0, c.score)),
          status,
        };
      });

    const codingSolved = codingProblemsSummaries.filter(
      (p) => p.status === "SOLVED",
    ).length;
    const totalCodingProblems =
      config.codingTotalProblems || codingEvalResults.length;

    const foundationBreakdown = {
      numericalScore,
      numericalMin,
      verbalScore,
      verbalMin,
      reasoningScore,
      reasoningMin,
      foundationTotal,
      ninjaThreshold: config.ninjaThreshold,
      digitalThreshold: config.digitalThreshold,
      primeThreshold: config.primeThreshold,
      sectionsBreakdown,
    };

    const advancedBreakdown = {
      sectionCode: advancedSectionCode,
      advancedScore,
      advancedMinDigital: config.advancedDigitalMin,
      advancedMinPrime: config.advancedPrimeMin,
      passedDigital: advancedScore >= config.advancedDigitalMin,
      passedPrime: advancedScore >= config.advancedPrimeMin,
    };

    const codingBreakdown = {
      totalCodingProblems,
      codingSolved,
      codingMinDigital: config.codingDigitalMinSolved,
      codingMinPrime: config.codingPrimeMinSolved,
      passedDigital: codingSolved >= config.codingDigitalMinSolved,
      passedPrime: codingSolved >= config.codingPrimeMinSolved,
      problems: codingProblemsSummaries,
    };

    // Step 1 Decision: Sectional cutoff check
    if (failedSectionalCutoff) {
      return {
        strategy: this.strategyType,
        strategyVersion: 1,
        qualification: "NOT_QUALIFIED",
        qualificationReason: "Sectional cutoff not cleared",
        foundationScore: foundationTotal,
        advancedScore,
        codingSolved,
        foundationBreakdown,
        advancedBreakdown,
        codingBreakdown,
        evaluatedAt: new Date(),
      };
    }

    // Step 2 Decision: Foundation Total < Ninja Threshold
    if (foundationTotal < config.ninjaThreshold) {
      return {
        strategy: this.strategyType,
        strategyVersion: 1,
        qualification: "NOT_QUALIFIED",
        qualificationReason: "Foundation cutoff not cleared",
        foundationScore: foundationTotal,
        advancedScore,
        codingSolved,
        foundationBreakdown,
        advancedBreakdown,
        codingBreakdown,
        evaluatedAt: new Date(),
      };
    }

    // Step 3 & Step 4 & Step 5: Candidate qualifies for Ninja or higher
    // Check Prime Rules
    const meetsPrimeFoundation = foundationTotal >= config.primeThreshold;
    const meetsPrimeAdvanced = advancedScore >= config.advancedPrimeMin;
    const meetsPrimeCoding = codingSolved >= config.codingPrimeMinSolved;

    if (meetsPrimeFoundation && meetsPrimeAdvanced && meetsPrimeCoding) {
      return {
        strategy: this.strategyType,
        strategyVersion: 1,
        qualification: "PRIME",
        qualificationReason: "Qualified for Prime role",
        foundationScore: foundationTotal,
        advancedScore,
        codingSolved,
        foundationBreakdown,
        advancedBreakdown,
        codingBreakdown,
        evaluatedAt: new Date(),
      };
    }

    // Check Digital Rules
    const meetsDigitalFoundation = foundationTotal >= config.digitalThreshold;
    const meetsDigitalAdvanced = advancedScore >= config.advancedDigitalMin;
    const meetsDigitalCoding = codingSolved >= config.codingDigitalMinSolved;

    if (meetsDigitalFoundation && meetsDigitalAdvanced && meetsDigitalCoding) {
      return {
        strategy: this.strategyType,
        strategyVersion: 1,
        qualification: "DIGITAL",
        qualificationReason: "Qualified for Digital role",
        foundationScore: foundationTotal,
        advancedScore,
        codingSolved,
        foundationBreakdown,
        advancedBreakdown,
        codingBreakdown,
        evaluatedAt: new Date(),
      };
    }

    // Default Fallback: NINJA
    return {
      strategy: this.strategyType,
      strategyVersion: 1,
      qualification: "NINJA",
      qualificationReason:
        foundationTotal >= config.digitalThreshold
          ? "Qualified for Ninja (Advanced/Coding criteria for Digital/Prime not met)"
          : "Qualified for Ninja role",
      foundationScore: foundationTotal,
      advancedScore,
      codingSolved,
      foundationBreakdown,
      advancedBreakdown,
      codingBreakdown,
      evaluatedAt: new Date(),
    };
  }
}
