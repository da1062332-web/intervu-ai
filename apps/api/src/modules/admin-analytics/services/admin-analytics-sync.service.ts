import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ContentCoverageService } from "./content-coverage.service";
import { QuestionStatus, AssemblyStatus } from "@prisma/client";

@Injectable()
export class AdminAnalyticsSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverageService: ContentCoverageService,
  ) {}

  async syncAll() {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // ─── 1. Sync Generation Analytics ───
    const [
      genJobsCount,
      genSuccesses,
      jobFailures,
      logFailures,
      genLogsAvg,
      questions,
      generatedQuestions,
      recentJobs,
      recentLogs,
    ] = await Promise.all([
      this.prisma.generationJob.count(),
      this.prisma.generationJob.count({ where: { status: "COMPLETED" } }),
      this.prisma.generationJob.count({ where: { status: "FAILED" } }),
      this.prisma.generationLog.count({ where: { status: { in: ["FAILED", "ERROR", "FAILURE"] } } }),
      this.prisma.generationLog.aggregate({ _avg: { durationMs: true } }),
      this.prisma.question.findMany({ where: { source: "GENERATED" }, include: { topic: true } }),
      this.prisma.generatedQuestion.findMany({ select: { conceptKey: true, difficultyLevel: true, createdAt: true } }),
      this.prisma.generationJob.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 6 * 24 * 3600 * 1000) } },
        select: { createdAt: true, status: true },
      }),
      this.prisma.generationLog.findMany({
        where: {
          createdAt: { gte: new Date(now.getTime() - 6 * 24 * 3600 * 1000) },
          status: { in: ["FAILED", "ERROR", "FAILURE"] },
        },
        select: { createdAt: true },
      }),
    ]);

    const genFailures = Math.max(jobFailures, logFailures);
    const genRequests = Math.max(genJobsCount, genSuccesses + genFailures);
    const avgDurationMs = genLogsAvg._avg.durationMs || 4500;

    const questionsGeneratedPerTopic: Record<string, number> = {};
    const questionsGeneratedPerDifficulty: Record<string, number> = {};

    for (const q of questions) {
      const topicName = q.topic?.name || "Unknown";
      questionsGeneratedPerTopic[topicName] = (questionsGeneratedPerTopic[topicName] || 0) + 1;
      questionsGeneratedPerDifficulty[q.difficulty] = (questionsGeneratedPerDifficulty[q.difficulty] || 0) + 1;
    }
    for (const gq of generatedQuestions) {
      const topicName = gq.conceptKey || "General";
      questionsGeneratedPerTopic[topicName] = (questionsGeneratedPerTopic[topicName] || 0) + 1;
      questionsGeneratedPerDifficulty[gq.difficultyLevel] = (questionsGeneratedPerDifficulty[gq.difficultyLevel] || 0) + 1;
    }

    // Live daily trend data from actual generation records
    const trendMap: Record<string, { date: string; success: number; failure: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000).toISOString().split("T")[0];
      trendMap[d] = { date: d, success: 0, failure: 0 };
    }

    for (const job of recentJobs) {
      const d = job.createdAt.toISOString().split("T")[0];
      if (trendMap[d]) {
        if (job.status === "COMPLETED") trendMap[d].success++;
        else if (job.status === "FAILED") trendMap[d].failure++;
      }
    }
    for (const log of recentLogs) {
      const d = log.createdAt.toISOString().split("T")[0];
      if (trendMap[d] && trendMap[d].failure === 0) {
        trendMap[d].failure++;
      }
    }
    for (const gq of generatedQuestions) {
      const d = gq.createdAt.toISOString().split("T")[0];
      if (trendMap[d] && trendMap[d].success === 0) {
        trendMap[d].success++;
      }
    }

    const trendData = Object.values(trendMap);

    const genAnalytics = await this.prisma.generationAnalytics.create({
      data: {
        requests: genRequests,
        successes: genSuccesses,
        failures: genFailures,
        avgDurationMs,
        questionsGeneratedPerTopic,
        questionsGeneratedPerDifficulty,
        trendData,
      },
    });

    // ─── 2. Sync Review Analytics ───
    const pendingReviews = await this.prisma.question.count({
      where: { status: QuestionStatus.DRAFT },
    });
    const approvedToday = await this.prisma.questionReview.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: startOfToday },
      },
    });
    const rejectedToday = await this.prisma.questionReview.count({
      where: {
        status: "REJECTED",
        createdAt: { gte: startOfToday },
      },
    });

    // Workload group by notes parsing
    const reviews = await this.prisma.questionReview.findMany();
    const reviewerWorkload: Record<string, number> = {};
    for (const r of reviews) {
      let reviewer = "AI Reviewer";
      if (r.notes?.includes("Approved by")) {
        reviewer = r.notes.replace("Approved by ", "");
      } else if (r.notes?.includes("Rejected by")) {
        reviewer = r.notes.replace("Rejected by ", "");
      }
      reviewerWorkload[reviewer] = (reviewerWorkload[reviewer] || 0) + 1;
    }

    const reviewAnalytics = await this.prisma.reviewAnalytics.create({
      data: {
        pendingReviews,
        approvedToday,
        rejectedToday,
        avgReviewTimeSeconds: 120, // default average review time (2 mins)
        reviewerWorkload,
      },
    });

    // ─── 3. Sync Content Coverage ───
    const coverage = await this.coverageService.calculateCoverage();
    const contentCoverage = await this.prisma.contentCoverage.create({
      data: {
        missingTopics: coverage.missingTopics,
        lowCoverageTopics: coverage.lowCoverageTopics,
        difficultyGaps: coverage.difficultyGaps,
        unusedQuestions: coverage.unusedQuestions,
      },
    });

    // ─── 4. Evaluate & Sync Admin Alerts ───
    // Fetch all currently active alerts
    const activeAlerts = await this.prisma.adminAlert.findMany({
      where: { status: "ACTIVE" },
    });

    // Helper to find alert by type and optionally match metadata fields
    const findAlert = (type: string, matchMeta?: (meta: any) => boolean) => {
      return activeAlerts.find((alert) => {
        if (alert.type !== type) return false;
        if (!matchMeta) return true;
        const meta = alert.metadata ? (alert.metadata as any) : {};
        return matchMeta(meta);
      });
    };

    // Low question inventory alert
    const lowInvAlert = findAlert("LOW_INVENTORY");
    if (coverage.lowCoverageTopics.length > 0) {
      const message = `There are ${coverage.lowCoverageTopics.length} topics with low question inventory (< 10 questions).`;
      if (lowInvAlert) {
        await this.prisma.adminAlert.update({
          where: { id: lowInvAlert.id },
          data: {
            message,
            metadata: { count: coverage.lowCoverageTopics.length },
          },
        });
      } else {
        await this.prisma.adminAlert.create({
          data: {
            type: "LOW_INVENTORY",
            message,
            severity: "WARNING",
            status: "ACTIVE",
            metadata: { count: coverage.lowCoverageTopics.length },
          },
        });
      }
    } else if (lowInvAlert) {
      await this.prisma.adminAlert.update({
        where: { id: lowInvAlert.id },
        data: { status: "RESOLVED" },
      });
    }

    // Review Queue Overflow alert
    const queueOverflowAlert = findAlert("QUEUE_OVERFLOW");
    if (pendingReviews > 30) {
      const message = `Review Queue size is critical! ${pendingReviews} questions are pending review.`;
      if (queueOverflowAlert) {
        await this.prisma.adminAlert.update({
          where: { id: queueOverflowAlert.id },
          data: {
            message,
            metadata: { count: pendingReviews },
          },
        });
      } else {
        await this.prisma.adminAlert.create({
          data: {
            type: "QUEUE_OVERFLOW",
            message,
            severity: "CRITICAL",
            status: "ACTIVE",
            metadata: { count: pendingReviews },
          },
        });
      }
    } else if (queueOverflowAlert) {
      await this.prisma.adminAlert.update({
        where: { id: queueOverflowAlert.id },
        data: { status: "RESOLVED" },
      });
    }

    // AI Generation Failure alerts
    const activeFailedJobs = await this.prisma.generationJob.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    for (const job of activeFailedJobs) {
      const existing = findAlert(
        "GENERATION_FAILURE",
        (meta) => meta.jobId === job.id,
      );
      if (!existing) {
        await this.prisma.adminAlert.create({
          data: {
            type: "GENERATION_FAILURE",
            message: `AI Generation Job failed for topic: ${job.topic}. Reason: ${job.error || "Unknown error"}`,
            severity: "CRITICAL",
            status: "ACTIVE",
            metadata: { jobId: job.id, topic: job.topic },
          },
        });
      }
    }

    // Assembly Failure alerts
    const failedAssemblies = await this.prisma.assembledTest.findMany({
      where: { status: AssemblyStatus.ARCHIVED },
      take: 5,
    });
    for (const assembly of failedAssemblies) {
      const existing = findAlert(
        "ASSEMBLY_FAILURE",
        (meta) => meta.assemblyId === assembly.id,
      );
      if (!existing) {
        await this.prisma.adminAlert.create({
          data: {
            type: "ASSEMBLY_FAILURE",
            message: `Test Assembly failed for Config ID: ${assembly.configId}.`,
            severity: "WARNING",
            status: "ACTIVE",
            metadata: { assemblyId: assembly.id, configId: assembly.configId },
          },
        });
      }
    }

    return {
      generation: genAnalytics,
      review: reviewAnalytics,
      coverage: contentCoverage,
    };
  }
}
