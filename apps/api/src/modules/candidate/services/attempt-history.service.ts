import { Injectable } from "@nestjs/common";
import { AttemptHistoryRepository } from "../repositories/attempt-history.repository";
import { AttemptHistoryResponseDto } from "../dto/attempt-history.dto";
import { EntitlementService } from "../../billing/services/entitlement.service";

interface CachedAttemptHistory {
  data: AttemptHistoryResponseDto;
  expiresAt: number;
}

const attemptHistoryMemCache = new Map<string, CachedAttemptHistory>();
const inFlightHistoryRequests = new Map<string, Promise<AttemptHistoryResponseDto>>();

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
    const cacheKey = `${userId}:${page}:${limit}`;
    const cached = attemptHistoryMemCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const existingPromise = inFlightHistoryRequests.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const requestPromise = this.computeAttemptHistory(userId, page, limit)
      .then((data) => {
        attemptHistoryMemCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + 30_000, // 30s cache
        });
        inFlightHistoryRequests.delete(cacheKey);
        return data;
      })
      .catch((err) => {
        inFlightHistoryRequests.delete(cacheKey);
        throw err;
      });

    inFlightHistoryRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  private async computeAttemptHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<AttemptHistoryResponseDto> {
    const skip = (page - 1) * limit;

    // Run entitlements, attempts query, and all user attempt configs in parallel
    const [entitlements, result, userInstances] = await Promise.all([
      this.entitlementService.getUserEntitlements(userId).catch(() => null),
      this.attemptHistoryRepository.findAttemptsByUser({
        userId,
        skip,
        take: limit,
      }),
      this.attemptHistoryRepository.getUserAttemptConfigs(userId).catch(() => []),
    ]);

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

    // Map attempts and compute attempt counts in-memory without N+1 queries
    const attemptsWithCounts = items.map((t: any) => {
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

      const attemptCount = (userInstances || []).filter(
        (inst: any) =>
          (t.examConfigId && inst.examConfigId === t.examConfigId) ||
          (t.testConfigId && inst.testConfigId === t.testConfigId),
      ).length;

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
        attemptNumber: attemptCount,
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
    });

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

