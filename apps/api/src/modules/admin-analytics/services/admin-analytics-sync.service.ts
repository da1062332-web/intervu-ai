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
    const genRequests = await this.prisma.generationJob.count();
    const genSuccesses = await this.prisma.generationJob.count({
      where: { status: "COMPLETED" },
    });
    const genFailures = await this.prisma.generationJob.count({
      where: { status: "FAILED" },
    });

    const genLogsAvg = await this.prisma.generationLog.aggregate({
      _avg: { durationMs: true },
    });
    const avgDurationMs = genLogsAvg._avg.durationMs || 4500;

    // Group questions by topic where source = "GENERATED"
    const questions = await this.prisma.question.findMany({
      where: { source: "GENERATED" },
      include: { topic: true },
    });

    const questionsGeneratedPerTopic: Record<string, number> = {};
    const questionsGeneratedPerDifficulty: Record<string, number> = {};

    for (const q of questions) {
      const topicName = q.topic?.name || "Unknown";
      questionsGeneratedPerTopic[topicName] =
        (questionsGeneratedPerTopic[topicName] || 0) + 1;
      questionsGeneratedPerDifficulty[q.difficulty] =
        (questionsGeneratedPerDifficulty[q.difficulty] || 0) + 1;
    }

    // Mock trend data for visualization
    const trendData = [
      {
        date: new Date(now.getTime() - 4 * 24 * 3600 * 1000)
          .toISOString()
          .split("T")[0],
        success: Math.round(genSuccesses * 0.1),
        failure: Math.round(genFailures * 0.1),
      },
      {
        date: new Date(now.getTime() - 3 * 24 * 3600 * 1000)
          .toISOString()
          .split("T")[0],
        success: Math.round(genSuccesses * 0.2),
        failure: Math.round(genFailures * 0.1),
      },
      {
        date: new Date(now.getTime() - 2 * 24 * 3600 * 1000)
          .toISOString()
          .split("T")[0],
        success: Math.round(genSuccesses * 0.3),
        failure: Math.round(genFailures * 0.2),
      },
      {
        date: new Date(now.getTime() - 1 * 24 * 3600 * 1000)
          .toISOString()
          .split("T")[0],
        success: Math.round(genSuccesses * 0.2),
        failure: Math.round(genFailures * 0.4),
      },
      {
        date: now.toISOString().split("T")[0],
        success: Math.round(genSuccesses * 0.2),
        failure: Math.round(genFailures * 0.2),
      },
    ];

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
      const existing = findAlert("GENERATION_FAILURE", (meta) => meta.jobId === job.id);
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
      const existing = findAlert("ASSEMBLY_FAILURE", (meta) => meta.assemblyId === assembly.id);
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
