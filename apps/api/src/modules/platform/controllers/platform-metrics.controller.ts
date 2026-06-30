import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PlatformHealthService } from "../health/platform-health.service";
import {
  PlatformAuditService,
  GetAuditLogsDto,
} from "../audit/platform-audit.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import { GeneratedQuestionRepository } from "../../question-pool/repositories/generated-question.repository";
import { QuestionRepository } from "../../question-bank/repositories/question.repository";
import { ExecutionStateRepository } from "../../execution/repositories/execution-state.repository";
import { EvaluationRepository } from "../../results/repositories/evaluation.repository";
import { PerformanceRepository } from "../../results/repositories/performance.repository";

@ApiTags("platform")
@Controller("platform")
export class PlatformMetricsController {
  constructor(
    private readonly healthService: PlatformHealthService,
    private readonly auditService: PlatformAuditService,
    private readonly prisma: PrismaService,
    private readonly examConfigRepo: ExamConfigRepository,
    private readonly generatedQuestionRepo: GeneratedQuestionRepository,
    private readonly questionRepo: QuestionRepository,
    private readonly executionStateRepo: ExecutionStateRepository,
    private readonly evaluationRepo: EvaluationRepository,
    private readonly performanceRepo: PerformanceRepository,
  ) {}

  @Get("health")
  @Public()
  @ApiOperation({ summary: "Get global platform health telemetry" })
  async getGlobalHealth() {
    return this.healthService.getHealth();
  }

  @Get("metrics")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get global platform metrics" })
  async getMetrics() {
    const [
      questionsGenerated,
      questionsApproved,
      activeSessions,
      evaluationsCompleted,
    ] = await Promise.all([
      this.generatedQuestionRepo.count(),
      this.questionRepo.count({ status: "ACTIVE" }),
      this.executionStateRepo.count({
        testInstance: {
          status: "IN_PROGRESS",
        },
      }),
      this.evaluationRepo.count(),
    ]);

    return {
      questionsGenerated,
      questionsApproved,
      activeSessions,
      evaluationsCompleted,
    };
  }

  @Get("audit")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get aggregated system audit logs" })
  async getAuditLogs(@Query() query: GetAuditLogsDto) {
    return this.auditService.getAuditLogs(query);
  }

  // Module Health Endpoints module1 -> module6
  @Get("health/module1")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 1: Exam Config Health" })
  async getModule1Health() {
    const start = Date.now();
    const lastActivity = await this.examConfigRepo.findLastActivity();
    const errorCount = await this.prisma.generationLog.count({
      where: { status: "FAILED", step: "CONTEXT_RESOLVE" },
    });
    return {
      module: "Module 1 - Exam Configuration Manager",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount,
      lastActivity,
    };
  }

  @Get("health/module2")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 2: Test Generation Health" })
  async getModule2Health() {
    const start = Date.now();
    const lastGen = await this.prisma.generationLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const errorCount = await this.prisma.generationLog.count({
      where: { status: "FAILED" },
    });
    return {
      module: "Module 2 - Test Generation Engine",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount,
      lastActivity: lastGen?.createdAt || null,
    };
  }

  @Get("health/module3")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 3: Test Assembly Health" })
  async getModule3Health() {
    const start = Date.now();
    const lastReservation = await this.prisma.questionReservation.findFirst({
      orderBy: { reservedAt: "desc" },
      select: { reservedAt: true },
    });
    return {
      module: "Module 3 - Question Assembly Provider",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount: 0,
      lastActivity: lastReservation?.reservedAt || null,
    };
  }

  @Get("health/module4")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 4: Execution Engine Health" })
  async getModule4Health() {
    const start = Date.now();
    const lastActivity = await this.executionStateRepo.findLastActivity();
    return {
      module: "Module 4 - Test Execution Engine",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount: 0,
      lastActivity,
    };
  }

  @Get("health/module5")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 5: Evaluation Health" })
  async getModule5Health() {
    const start = Date.now();
    const lastActivity = await this.evaluationRepo.findLastActivity();
    return {
      module: "Module 5 - Evaluation Engine",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount: 0,
      lastActivity,
    };
  }

  @Get("health/module6")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 6: Analytics Health" })
  async getModule6Health() {
    const start = Date.now();
    const lastActivity = await this.performanceRepo.findLastActivity();
    return {
      module: "Module 6 - Analytics Dashboard",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount: 0,
      lastActivity,
    };
  }
}
