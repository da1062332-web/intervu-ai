import { Injectable } from "@nestjs/common";
import { AttemptHistoryRepository } from "../repositories/attempt-history.repository";
import { AttemptHistoryResponseDto } from "../dto/attempt-history.dto";
import { EntitlementService } from "../../billing/services/entitlement.service";

@Injectable()
export class AttemptHistoryService {
  constructor(
    private readonly attemptHistoryRepository: AttemptHistoryRepository,
    private readonly entitlementService: EntitlementService,
  ) {}

  async getAttemptHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<AttemptHistoryResponseDto> {
    const skip = (page - 1) * limit;

    // 1. Fetch user entitlements from active subscription plan
    let entitlements = null;
    try {
      entitlements = await this.entitlementService.getUserEntitlements(userId);
    } catch {}

    const hasActivePlan = Boolean(entitlements?.hasActivePlan);
    const features = (entitlements?.features as any) || {};
    const historyLimit = features.roundHistoryLimit ?? features.history_limit ?? null;

    if (!hasActivePlan) {
      return {
        attempts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    }

    // Resolve attemptsPerExam override
    const allowedAssessmentsVal = features.allowedAssessments || features.allowed_assessments;
    let attemptsPerExamOverride: number | null = null;
    if (allowedAssessmentsVal && typeof allowedAssessmentsVal === "object" && !Array.isArray(allowedAssessmentsVal)) {
      if (typeof allowedAssessmentsVal.attemptsPerExam === "number") {
        attemptsPerExamOverride = allowedAssessmentsVal.attemptsPerExam;
      }
    }

    const result = await this.attemptHistoryRepository.findAttemptsByUser({
      userId,
      skip,
      take: limit,
    });

    let effectiveTotal = result.total;
    let items = result.items;

    if (typeof historyLimit === "number" && historyLimit > 0) {
      effectiveTotal = Math.min(result.total, historyLimit);
      if (skip >= historyLimit) {
        items = [];
      } else {
        const allowedTake = Math.min(limit, historyLimit - skip);
        items = items.slice(0, allowedTake);
      }
    }

    const totalPages = Math.max(1, Math.ceil(effectiveTotal / limit));

    const attemptsWithCounts = await Promise.all(
      items.map(async (t: any) => {
        const rawScore =
          t.candidateResult?.percentage ??
          t.candidateResult?.score ??
          t.evaluationResult?.overallScore ??
          null;

        let score =
          typeof rawScore === "number"
            ? rawScore <= 1 && rawScore > 0
              ? Math.round(rawScore * 100)
              : Math.round(rawScore)
            : null;

        // If attempt is completed or submitted, fallback missing score to 0
        if (
          score === null &&
          (t.status === "COMPLETED" || t.status === "SUBMITTED")
        ) {
          score = 0;
        }

        const status =
          (Boolean(t.evaluationResult) ||
            Boolean(t.candidateResult) ||
            rawScore !== null) &&
          (t.status === "SUBMITTED" || t.status === "COMPLETED")
            ? "COMPLETED"
            : t.status;

        const maxAttempts =
          attemptsPerExamOverride ??
          ((t.examConfig?.ruleFlags?.maxAttempts as number) || 3);
        const attemptCount = await this.attemptHistoryRepository.countAttemptsByConfig(userId, t.examConfigId, t.testConfigId);
        const remainingAttempts = Math.max(0, maxAttempts - attemptCount);
        const canReAttempt = remainingAttempts > 0;

        return {
          instanceId: t.id,
          attemptId: t.id,
          examConfigId: t.examConfigId,
          testConfigId: t.testConfigId,
          testName:
            t.testConfig?.displayName ||
            t.examConfig?.name ||
            "Unknown Assessment",
          assessmentName:
            t.testConfig?.displayName ||
            t.examConfig?.name ||
            "Unknown Assessment",
          date: t.createdAt.toISOString(),
          submittedAt: t.submittedAt
            ? t.submittedAt.toISOString()
            : t.createdAt.toISOString(),
          score,
          percentage: score,
          maxScore: 100,
          evaluationId: t.evaluationResult ? `eval_${t.id}` : null,
          status,
          attemptNumber: attemptCount, // Overwrite with actual attempt count for this specific config
          attemptCount,
          maxAttempts,
          remainingAttempts,
          canReAttempt,
          durationSeconds:
            t.startedAt && t.submittedAt
              ? Math.floor(
                  (t.submittedAt.getTime() - t.startedAt.getTime()) / 1000,
                )
              : 3600,
          duration:
            t.startedAt && t.submittedAt
              ? Math.floor(
                  (t.submittedAt.getTime() - t.startedAt.getTime()) / 1000,
                )
              : 3600,
        };
      })
    );

    return {
      attempts: attemptsWithCounts,
      pagination: {
        page,
        limit,
        total: effectiveTotal,
        totalPages,
      },
    };
  }
}
