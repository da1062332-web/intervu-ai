import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole, Prisma } from "@prisma/client";
import { UserRepository } from "../users/repositories/user.repository";
import { CandidateProfileRepository } from "../candidate/repositories/candidate-profile.repository";
import { AttemptHistoryRepository } from "../candidate/repositories/attempt-history.repository";
import { PerformanceRepository } from "../results/repositories/performance.repository";
import { EnrollmentRepository } from "../candidate/repositories/enrollment.repository";
import { CandidateResultRepository } from "../results/repositories/candidate-result.repository";
import {
  CandidateListQueryDto,
  CandidateListResponseDto,
  CandidateDetailsResponseDto,
  CandidateStatsResponseDto,
  CandidateTestHistoryQueryDto,
  CandidateTestHistoryResponseDto,
} from "./dto/admin-candidates.dto";

@Injectable()
export class AdminCandidatesService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly candidateProfileRepository: CandidateProfileRepository,
    private readonly attemptHistoryRepository: AttemptHistoryRepository,
    private readonly performanceRepository: PerformanceRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly candidateResultRepository: CandidateResultRepository,
  ) {}

  async getCandidateList(
    query: CandidateListQueryDto,
  ): Promise<CandidateListResponseDto> {
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
    const sortBy = query.sortBy || "createdAt";

    const where: Prisma.UserWhereInput = {
      role: UserRole.CANDIDATE,
    };

    if (query.status === "ACTIVE") {
      where.deletedAt = null;
    } else if (query.status === "INACTIVE") {
      where.deletedAt = { not: null };
    } else {
      // Fetch all candidates (both active and inactive)
      delete (where as any).deletedAt;
    }

    if (query.search && query.search.trim() !== "") {
      const search = query.search.trim();
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === "name") {
      orderBy = { fullName: sortOrder };
    } else if (sortBy === "averageScore" || sortBy === "bestScore") {
      orderBy = { performanceSummary: { [sortBy]: sortOrder } };
    } else if (["email", "createdAt"].includes(sortBy)) {
      orderBy = { [sortBy]: sortOrder };
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [{ items, total }, statusCounts] = await Promise.all([
      this.userRepository.findCandidatesWithSummary({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.userRepository.getCandidateStatusCounts(where),
    ]);

    const formattedItems = await Promise.all(
      items.map(async (user: any) => {
        const [perf, res] = await Promise.all([
          this.performanceRepository.getAggregatedPerformance(user.id),
          this.candidateResultRepository.findCandidateResults(user.id, 1, 1),
        ]);
        const summary = user.performanceSummary || {};
        const completedTests = perf.testsCompleted || summary.testsCompleted || 0;
        const averageScore = Math.round(
          perf.averageScore || summary.averageScore || 0,
        );
        const bestScore = Math.round(
          perf.bestScore || summary.bestScore || 0,
        );
        const lastAttemptDate = perf.lastAssessmentDate || summary.lastAssessmentDate;
        const latestResult = res.items?.[0];

        return {
          id: user.id,
          name: user.fullName || "Unnamed Candidate",
          email: user.email || "",
          status: user.deletedAt ? "INACTIVE" : "ACTIVE",
          assignedTests: user._count?.enrollments || 0,
          attemptedTests: user._count?.testInstances || 0,
          completedTests,
          averageScore,
          bestScore,
          qualification: latestResult?.qualification || undefined,
          lastAttempt: lastAttemptDate
            ? new Date(lastAttemptDate).toISOString()
            : "",
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
        };
      }),
    );

    return {
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        total: statusCounts.total,
        activeCount: statusCounts.active,
        inactiveCount: statusCounts.inactive,
      },
    };
  }

  async getCandidateDetails(
    candidateId: string,
  ): Promise<CandidateDetailsResponseDto> {
    const user = await this.candidateProfileRepository.findById(candidateId);
    if (!user || user.role !== UserRole.CANDIDATE) {
      throw new NotFoundException("Candidate not found");
    }

    return {
      id: user.id,
      name: user.fullName || "Unnamed Candidate",
      email: user.email || "",
      phone: user.phone || "",
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
      status: user.deletedAt ? "INACTIVE" : "ACTIVE",
    };
  }

  async getCandidateStats(
    candidateId: string,
  ): Promise<CandidateStatsResponseDto> {
    const user = await this.candidateProfileRepository.findById(candidateId);
    if (!user || user.role !== UserRole.CANDIDATE) {
      throw new NotFoundException("Candidate not found");
    }

    const [perf, enrollments, attempts] = await Promise.all([
      this.performanceRepository.getAggregatedPerformance(candidateId),
      this.enrollmentRepository.findAllByUser(candidateId),
      this.attemptHistoryRepository.findAttemptsByUser({
        userId: candidateId,
        skip: 0,
        take: 1,
      }),
    ]);

    return {
      assignedTests: enrollments.length,
      attemptedTests: attempts.total,
      completedTests: perf.testsCompleted || 0,
      averageScore: Math.round(perf.averageScore || 0),
      bestScore: Math.round(perf.bestScore || 0),
      lastAttempt: perf.lastAssessmentDate
        ? new Date(perf.lastAssessmentDate).toISOString()
        : "",
    };
  }

  async getCandidateTestHistory(
    candidateId: string,
    query: CandidateTestHistoryQueryDto,
  ): Promise<CandidateTestHistoryResponseDto> {
    const user = await this.candidateProfileRepository.findById(candidateId);
    if (!user || user.role !== UserRole.CANDIDATE) {
      throw new NotFoundException("Candidate not found");
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.attemptHistoryRepository.findAttemptsByUser({
      userId: candidateId,
      skip,
      take: limit,
    });

    const enrichedItems = await Promise.all(
      items.map(async (attempt: any) => {
        const candResult =
          await this.candidateResultRepository.findResultByAttemptId(attempt.id);
        const evalScore = attempt.evaluationResult?.overallScore;
        const score =
          candResult?.score ?? (evalScore !== undefined ? evalScore : 0);
        const percentage =
          candResult?.percentage ?? (evalScore !== undefined ? evalScore : 0);
        const assessmentName =
          attempt.examConfig?.name ||
          attempt.testConfig?.displayName ||
          "Assessment";

        return {
          attemptId: attempt.id,
          assessmentName,
          status: attempt.status || "UNKNOWN",
          score: Math.round(score),
          percentage: Math.round(percentage),
          startedAt: attempt.startedAt
            ? new Date(attempt.startedAt).toISOString()
            : (attempt.createdAt ? new Date(attempt.createdAt).toISOString() : ""),
          submittedAt: attempt.submittedAt
            ? new Date(attempt.submittedAt).toISOString()
            : (attempt.status === "COMPLETED" || attempt.status === "SUBMITTED"
                ? (attempt.updatedAt ? new Date(attempt.updatedAt).toISOString() : "")
                : ""),
        };
      }),
    );

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
