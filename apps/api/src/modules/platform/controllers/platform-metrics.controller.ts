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

@ApiTags("platform")
@Controller("platform")
export class PlatformMetricsController {
  constructor(
    private readonly healthService: PlatformHealthService,
    private readonly auditService: PlatformAuditService,
    private readonly prisma: PrismaService,
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
      this.prisma.generatedQuestion.count(),
      this.prisma.question.count({ where: { status: "ACTIVE" } }),
      this.prisma.executionState.count({
        where: {
          testInstance: {
            status: "IN_PROGRESS",
          },
        },
      }),
      this.prisma.evaluationResult.count(),
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
    const lastConfig = await this.prisma.examConfig.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    const errorCount = await this.prisma.generationLog.count({
      where: { status: "FAILED", step: "CONTEXT_RESOLVE" },
    });
    return {
      module: "Module 1 - Exam Configuration Manager",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount,
      lastActivity: lastConfig?.updatedAt || null,
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
    const lastSession = await this.prisma.executionState.findFirst({
      orderBy: { lastActivityAt: "desc" },
      select: { lastActivityAt: true },
    });
    return {
      module: "Module 4 - Test Execution Engine",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount: 0,
      lastActivity: lastSession?.lastActivityAt || null,
    };
  }

  @Get("health/module5")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 5: Evaluation Health" })
  async getModule5Health() {
    const start = Date.now();
    const lastEvaluation = await this.prisma.evaluationResult.findFirst({
      orderBy: { evaluatedAt: "desc" },
      select: { evaluatedAt: true },
    });
    return {
      module: "Module 5 - Evaluation Engine",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount: 0,
      lastActivity: lastEvaluation?.evaluatedAt || null,
    };
  }

  @Get("health/module6")
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Module 6: Analytics Health" })
  async getModule6Health() {
    const start = Date.now();
    const lastSummary = await this.prisma.performanceSummary.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    return {
      module: "Module 6 - Analytics Dashboard",
      availability: "available",
      responseTime: Date.now() - start,
      errorCount: 0,
      lastActivity: lastSummary?.updatedAt || null,
    };
  }
}
