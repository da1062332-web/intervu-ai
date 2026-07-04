import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { ResultGeneratorService } from "../../services/result-generator.service";
import {
  ExpectedResultGenerator,
  SimulatedAttempt,
} from "../fixtures/expected-result-generator";
import {
  EvaluationComparator,
  ComparisonResult,
} from "../comparators/evaluation-comparator";
import fs from "fs";
import path from "path";

export interface ValidationReportDto {
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  successRate: number;
  failures: { attemptId: string; errors: string[] }[];
  durationMs: number;
}

@Injectable()
export class EvaluationValidationService {
  private readonly logger = new Logger("EvaluationValidationService");
  private readonly generator = new ExpectedResultGenerator();
  private readonly comparator = new EvaluationComparator();

  constructor(
    private readonly prisma: PrismaService,
    private readonly resultGenerator: ResultGeneratorService,
  ) {}

  /**
   * Executes the 2,000 attempt grading validation run and generates a report.
   */
  async runValidationSuite(count = 2000): Promise<ValidationReportDto> {
    const startTime = Date.now();
    this.logger.log(
      `Starting Evaluation Validation run with ${count} attempts...`,
    );

    // 1. Generate the expected dataset
    const dataset = this.generator.generateDataset(count);

    // Create an in-memory map of attempts for the prisma hook to fetch
    const attemptsMap = new Map<string, SimulatedAttempt>();
    dataset.forEach((item) => {
      attemptsMap.set(item.executionResult.testId, item);
    });

    // 2. Mock prisma testInstance calls
    const originalFindUnique = this.prisma.testInstance.findUnique;
    this.prisma.testInstance.findUnique = (async (args: any) => {
      const attemptId = args.where.id;
      const attempt = attemptsMap.get(attemptId);
      if (!attempt) return null;

      return {
        id: attemptId,
        userId: "val_user_123",
        testConfigId: "val_config_123",
        status: "COMPLETED",
        submittedAt: new Date(),
        sections: this.mapSectionsForPrisma(attempt),
      };
    }) as any;

    let passedCount = 0;
    let failedCount = 0;
    const failures: ValidationReportDto["failures"] = [];

    try {
      // 3. Loop and evaluate all attempts
      for (const item of dataset) {
        try {
          const actualResult = await this.resultGenerator.generateResult(
            item.executionResult,
          );
          const compResult = this.comparator.compare(actualResult, item);

          if (compResult.passed) {
            passedCount++;
          } else {
            failedCount++;
            failures.push({
              attemptId: item.executionResult.testId,
              errors: compResult.errors,
            });
          }
        } catch (err: any) {
          failedCount++;
          failures.push({
            attemptId: item.executionResult.testId,
            errors: [err.message || String(err)],
          });
        }
      }
    } finally {
      // Restore Prisma original method
      this.prisma.testInstance.findUnique = originalFindUnique;
    }

    const durationMs = Date.now() - startTime;
    const successRate = count > 0 ? (passedCount / count) * 100 : 100;

    const report: ValidationReportDto = {
      totalScenarios: count,
      passedCount,
      failedCount,
      successRate: parseFloat(successRate.toFixed(2)),
      failures,
      durationMs,
    };

    // Save report to disk inside the reports/ folder
    this.saveReportFile(report);

    this.logger.log(
      `Validation run completed: ${passedCount} PASS, ${failedCount} FAIL in ${durationMs}ms`,
    );
    return report;
  }

  private mapSectionsForPrisma(attempt: SimulatedAttempt) {
    const sectionsMap = new Map<string, any>();

    attempt.questions.forEach((q) => {
      if (!sectionsMap.has(q.sectionKey)) {
        sectionsMap.set(q.sectionKey, {
          id: `sec_val_${q.sectionKey}`,
          sectionKey: q.sectionKey,
          sectionName: q.sectionName,
          orderIndex: 0,
          questions: [],
        });
      }

      sectionsMap.get(q.sectionKey).questions.push({
        questionId: q.id,
        questionSnapshot: {
          answer: q.answer,
          questionType: q.questionType,
          difficulty: q.difficulty,
          topic: { name: q.topicName },
        },
      });
    });

    return Array.from(sectionsMap.values());
  }

  private saveReportFile(report: ValidationReportDto) {
    try {
      const dirPath = path.join(__dirname, "../reports");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.join(dirPath, "evaluation-validation-report.json");
      fs.writeFileSync(filePath, JSON.stringify(report, null, 2), "utf8");
    } catch (err) {
      this.logger.error(
        "Failed to save evaluation validation report to file",
        err,
      );
    }
  }
}
