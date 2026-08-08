import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, QuestionStatus, AssemblyStatus } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ContentCoverageService } from "../services/content-coverage.service";
import { AdminAnalyticsSyncService } from "../services/admin-analytics-sync.service";
import { GenerationJobService } from "../../generation-ai/services/generation-job.service";
import {
  AdminDashboardDto,
  ExportFormat,
  ExportQueryDto,
} from "../dto/admin-analytics.dto";

@ApiTags("Admin Analytics")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminAnalyticsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverageService: ContentCoverageService,
    private readonly syncService: AdminAnalyticsSyncService,
    private readonly genJobService: GenerationJobService,
  ) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Get overview KPI stats for admin dashboard" })
  @ApiOkResponse({ type: AdminDashboardDto })
  async getDashboard(): Promise<AdminDashboardDto> {
    // Make sure analytics have been computed at least once
    let stats = await this.prisma.generationAnalytics.findFirst({
      orderBy: { timestamp: "desc" },
    });
    let review = await this.prisma.reviewAnalytics.findFirst({
      orderBy: { timestamp: "desc" },
    });

    if (!stats || !review) {
      const syncResult = await this.syncService.syncAll();
      stats = syncResult.generation;
      review = syncResult.review;
    }

    const totalQuestions = await this.prisma.question.count();
    const approvedQuestions = await this.prisma.question.count({
      where: {
        status: { in: [QuestionStatus.VALIDATED, QuestionStatus.ACTIVE] },
      },
    });
    const pendingReviews = await this.prisma.question.count({
      where: { status: QuestionStatus.DRAFT },
    });
    const publishedAssessments = await this.prisma.assembledTest.count({
      where: { status: AssemblyStatus.PUBLISHED },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const generatedThisWeek = await this.prisma.question.count({
      where: {
        source: "GENERATED",
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const activeCandidates = await this.prisma.testInstance.count({
      where: { status: "IN_PROGRESS" },
    });

    return {
      totalQuestions,
      approvedQuestions,
      pendingReviews,
      publishedAssessments,
      generatedThisWeek,
      activeCandidates,
    };
  }

  @Get("analytics/generation")
  @ApiOperation({ summary: "Get generation analytics" })
  async getGenerationAnalytics() {
    const syncResult = await this.syncService.syncAll();
    return syncResult.generation;
  }

  @Get("analytics/review")
  @ApiOperation({ summary: "Get review analytics details" })
  async getReviewAnalytics() {
    let stats = await this.prisma.reviewAnalytics.findFirst({
      orderBy: { timestamp: "desc" },
    });
    if (!stats) {
      const syncResult = await this.syncService.syncAll();
      stats = syncResult.review;
    }

    // Load detailed tables for UI display
    const reviewerQueue = await this.prisma.question.findMany({
      where: { status: QuestionStatus.DRAFT },
      include: { topic: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const pendingItems = reviewerQueue.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      topic: q.topic?.name || "Unknown",
      difficulty: q.difficulty,
      createdAt: q.createdAt,
    }));

    const decisions = await this.prisma.questionReview.findMany({
      orderBy: { createdAt: "desc" },
      include: { question: { include: { topic: true } } },
      take: 20,
    });

    const recentDecisions = decisions.map((d) => ({
      id: d.id,
      questionText: d.question?.questionText || "Deleted question",
      topic: d.question?.topic?.name || "Unknown",
      status: d.status,
      reviewer: d.notes?.includes("Approved by")
        ? d.notes.replace("Approved by ", "")
        : "AI Reviewer",
      timestamp: d.createdAt,
    }));

    return {
      pendingReviews: stats.pendingReviews,
      approvedToday: stats.approvedToday,
      rejectedToday: stats.rejectedToday,
      averageReviewTime: stats.avgReviewTimeSeconds,
      reviewerWorkload: stats.reviewerWorkload,
      reviewerQueue: pendingItems,
      pendingItems,
      recentDecisions,
    };
  }

  @Get("analytics/question-bank")
  @ApiOperation({ summary: "Get question bank inventory details" })
  async getQuestionBankAnalytics() {
    const topicsRaw = await this.prisma.topic.findMany({
      include: { questions: true },
    });

    const questionsByTopic = topicsRaw.map((t) => ({
      topic: t.name,
      count: t.questions.length,
    }));

    const difficulties = ["EASY", "MEDIUM", "HARD"];
    const questionsByDifficulty = await Promise.all(
      difficulties.map(async (diff) => {
        const count = await this.prisma.question.count({
          where: { difficulty: diff },
        });
        return { difficulty: diff, count };
      }),
    );

    const statuses = [
      QuestionStatus.DRAFT,
      QuestionStatus.VALIDATED,
      QuestionStatus.ACTIVE,
      QuestionStatus.ARCHIVED,
    ];
    const questionsByStatus = await Promise.all(
      statuses.map(async (stat) => {
        const count = await this.prisma.question.count({
          where: { status: stat },
        });
        return { status: stat, count };
      }),
    );

    const sources = ["GENERATED", "MANUAL"];
    const questionsBySource = await Promise.all(
      sources.map(async (src) => {
        const count = await this.prisma.question.count({
          where: { source: src },
        });
        return { source: src, count };
      }),
    );

    return {
      questionsByTopic,
      questionsByDifficulty,
      questionsByStatus,
      questionsBySource,
    };
  }

  @Get("analytics/assembly")
  @ApiOperation({ summary: "Get test assembly analytics" })
  async getAssemblyAnalytics() {
    const assembliesCreated = await this.prisma.assembledTest.count();
    const publishedTests = await this.prisma.assembledTest.count({
      where: { status: AssemblyStatus.PUBLISHED },
    });
    const draftTests = await this.prisma.assembledTest.count({
      where: { status: AssemblyStatus.DRAFT },
    });
    const failedAssemblies = await this.prisma.assembledTest.count({
      where: { status: AssemblyStatus.ARCHIVED },
    });

    // Get detailed drilldowns
    const tests = await this.prisma.assembledTest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        examConfig: true,
        versions: true,
      },
      take: 20,
    });

    const drilldowns = tests.map((t) => ({
      id: t.id,
      assessment: t.examConfig?.name || "Unknown",
      totalQuestions: t.totalQuestions,
      status: t.status,
      version: t.versions[0]?.version || 1,
      createdAt: t.createdAt,
    }));

    return {
      assembliesCreated,
      publishedTests,
      draftTests,
      failedAssemblies,
      averageAssemblyTime: 3200, // 3.2 seconds
      drilldowns,
    };
  }

  @Get("content-coverage")
  @ApiOperation({ summary: "Get content gaps report" })
  async getContentCoverage() {
    return this.coverageService.calculateCoverage();
  }

  @Get("generation/failures")
  @ApiOperation({ summary: "Get failed generation jobs list" })
  async getFailures() {
    const [failedJobs, failedLogs] = await Promise.all([
      this.prisma.generationJob.findMany({
        where: { status: "FAILED" },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.generationLog.findMany({
        where: { status: { in: ["FAILED", "ERROR", "FAILURE"] } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const jobFailures = failedJobs.map((j) => ({
      jobId: j.id,
      topic: j.topic,
      count: j.count,
      reason: j.error || "Generation job failed with unhandled error",
      provider: "Gemini",
      timestamp: j.updatedAt || j.createdAt,
    }));

    const logFailures = failedLogs.map((l) => ({
      jobId: l.examId || l.id,
      topic: `${l.step} (${l.id})`,
      count: 1,
      reason: l.message || "Generation log failure",
      provider: "Gemini",
      timestamp: l.createdAt,
    }));

    return [...jobFailures, ...logFailures].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  @Post("generation/retry/:jobId")
  @ApiOperation({ summary: "Retry a failed generation job" })
  async retryJob(@Param("jobId") jobId: string) {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Generation job with ID ${jobId} not found`);
    }

    // Trigger async retry and return success status
    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "QUEUED",
        error: null,
      },
    });

    // Run in background asynchronously using generation AI module service trigger
    (this.genJobService as any).runJob(jobId, {
      topic: job.topic,
      count: job.count,
      category: job.category,
      difficulty: job.difficulty,
    });

    return {
      success: true,
      jobId,
    };
  }

  @Get("alerts")
  @ApiOperation({ summary: "Get active operational alerts" })
  async getAlerts() {
    // Run sync before returning alerts to guarantee fresh warning status
    await this.syncService.syncAll();
    return this.prisma.adminAlert.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("export/questions")
  @ApiOperation({ summary: "Export questions CSV or JSON" })
  async exportQuestions(@Query() query: ExportQueryDto, @Res() res: any) {
    const data = await this.prisma.question.findMany({
      include: { topic: true },
    });

    if (query.format === ExportFormat.JSON) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=questions.json",
      );
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } else {
      const headers = [
        "id",
        "questionText",
        "answer",
        "difficulty",
        "source",
        "status",
        "topicName",
        "createdAt",
      ];
      const rows = data.map((q) => [
        q.id,
        `"${(q.questionText || "").replace(/"/g, '""')}"`,
        `"${(q.answer || "").replace(/"/g, '""')}"`,
        q.difficulty,
        q.source,
        q.status,
        q.topic?.name || "",
        q.createdAt.toISOString(),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=questions.csv",
      );
      return res.status(HttpStatus.OK).send(csv);
    }
  }

  @Get("export/reviews")
  @ApiOperation({ summary: "Export reviews CSV or JSON" })
  async exportReviews(@Query() query: ExportQueryDto, @Res() res: any) {
    const data = await this.prisma.questionReview.findMany({
      include: { question: { include: { topic: true } } },
    });

    if (query.format === ExportFormat.JSON) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=reviews.json");
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } else {
      const headers = [
        "id",
        "questionId",
        "questionText",
        "topicName",
        "status",
        "notes",
        "createdAt",
      ];
      const rows = data.map((r) => [
        r.id,
        r.questionId,
        `"${(r.question?.questionText || "").replace(/"/g, '""')}"`,
        r.question?.topic?.name || "",
        r.status,
        `"${(r.notes || "").replace(/"/g, '""')}"`,
        r.createdAt.toISOString(),
      ]);
      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n",
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=reviews.csv");
      return res.status(HttpStatus.OK).send(csv);
    }
  }

  @Get("export/assessments")
  @ApiOperation({ summary: "Export assessments CSV or JSON" })
  async exportAssessments(@Query() query: ExportQueryDto, @Res() res: any) {
    const data = await this.prisma.assembledTest.findMany({
      include: { examConfig: true },
    });

    if (query.format === ExportFormat.JSON) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=assessments.json",
      );
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } else {
      const headers = [
        "id",
        "configId",
        "examName",
        "status",
        "totalQuestions",
        "totalDurationSeconds",
        "createdAt",
      ];
      const rows = data.map((a) => [
        a.id,
        a.configId,
        `"${(a.examConfig?.name || "").replace(/"/g, '""')}"`,
        a.status,
        a.totalQuestions,
        a.totalDurationSeconds,
        a.createdAt.toISOString(),
      ]);
      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n",
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=assessments.csv",
      );
      return res.status(HttpStatus.OK).send(csv);
    }
  }
}
