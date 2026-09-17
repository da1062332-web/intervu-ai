import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { UserRole } from "@prisma/client";
import { LiveMonitoringService } from "../services/live-monitoring.service";
import { AttemptRecoveryService } from "../services/attempt-recovery.service";
import { LiveAlertService } from "../services/live-alert.service";
import { CodingMonitoringService } from "../services/coding-monitoring.service";
import {
  AuthorizeResumeDto,
  ExtendTimeDto,
  ForceSubmitDto,
  QueryCandidatesDto,
  ResolveAlertDto,
} from "../dto/monitoring.dto";
import { PrismaService } from "../../../prisma/prisma.service";

@ApiTags("Live Monitoring & Recovery")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth("jwt-auth")
@Controller("admin/monitoring")
export class LiveMonitoringController {
  constructor(
    private readonly monitoringService: LiveMonitoringService,
    private readonly recoveryService: AttemptRecoveryService,
    private readonly alertService: LiveAlertService,
    private readonly codingService: CodingMonitoringService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("overview")
  @ApiOperation({ summary: "Overview of all active assessments and system monitoring" })
  async getMonitoringOverview() {
    const [examConfigs, testConfigs] = await Promise.all([
      this.prisma.examConfig.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          name: true,
          code: true,
          durationMinutes: true,
          totalQuestions: true,
          status: true,
          isActive: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      this.prisma.testConfig.findMany({
        where: { isActive: true },
        select: {
          id: true,
          displayName: true,
          configKey: true,
          totalDurationSeconds: true,
          totalQuestions: true,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const mappedAssessments = [
      ...examConfigs.map((e) => ({
        id: e.id,
        name: e.name,
        code: e.code,
        durationMinutes: e.durationMinutes,
        totalQuestions: e.totalQuestions,
        status: e.status,
        isActive: e.isActive,
      })),
      ...testConfigs.map((t) => ({
        id: t.id,
        name: t.displayName,
        code: t.configKey,
        durationMinutes: Math.round((t.totalDurationSeconds || 3600) / 60),
        totalQuestions: t.totalQuestions || 20,
        status: t.isActive ? "ACTIVE" : "INACTIVE",
        isActive: t.isActive,
      })),
    ];

    const assessmentIds = mappedAssessments.map((a) => a.id);

    const activeAttemptsCounts =
      assessmentIds.length > 0
        ? await this.prisma.testInstance.groupBy({
            by: ["examConfigId", "testConfigId", "status"],
            where: {
              OR: [
                { examConfigId: { in: assessmentIds } },
                { testConfigId: { in: assessmentIds } },
              ],
              user: {
                role: { notIn: ["ADMIN", "PLAN_MANAGER"] as any },
              },
            },
            _count: { id: true },
          })
        : [];

    return {
      timestamp: new Date().toISOString(),
      assessments: mappedAssessments.map((a) => {
        const counts = activeAttemptsCounts.filter(
          (c) => c.examConfigId === a.id || c.testConfigId === a.id,
        );
        const active = counts
          .filter((c) => c.status === "IN_PROGRESS" || (c.status as any) === "ACTIVE")
          .reduce((sum, c) => sum + c._count.id, 0);
        const autoSubmitted = counts
          .filter((c) => (c.status as any) === "AUTO_SUBMITTED" || (c.status as any) === "ADMIN_REVIEW")
          .reduce((sum, c) => sum + c._count.id, 0);
        const submitted = counts
          .filter((c) => c.status === "SUBMITTED" || c.status === "COMPLETED")
          .reduce((sum, c) => sum + c._count.id, 0);

        return {
          ...a,
          metrics: {
            activeCandidates: active,
            autoSubmittedCandidates: autoSubmitted,
            submittedCandidates: submitted,
            totalAttempts: counts.reduce((sum, c) => sum + c._count.id, 0),
          },
        };
      }),
    };
  }

  @Get("assessments/:id/snapshot")
  @ApiOperation({ summary: "Retrieve full live assessment monitoring snapshot" })
  @ApiParam({ name: "id", description: "Assessment / ExamConfig ID" })
  async getAssessmentSnapshot(
    @Param("id") assessmentId: string,
    @Query() query: QueryCandidatesDto,
  ) {
    return this.monitoringService.getAssessmentLiveSnapshot(assessmentId, query);
  }

  @Get("assessments/:id/candidate/:attemptId")
  @ApiOperation({ summary: "Retrieve detailed candidate telemetry for 9-tab inspection drawer" })
  @ApiParam({ name: "id", description: "Assessment ID" })
  @ApiParam({ name: "attemptId", description: "TestInstance Attempt ID" })
  async getCandidateDetail(
    @Param("id") assessmentId: string,
    @Param("attemptId") attemptId: string,
  ) {
    return this.monitoringService.getCandidateDetail(assessmentId, attemptId);
  }

  @Get("assessments/:id/alerts")
  @ApiOperation({ summary: "Get active assessment alerts" })
  async getActiveAlerts(@Param("id") assessmentId: string) {
    return this.alertService.getActiveAlerts(assessmentId);
  }

  @Post("alerts/:alertId/resolve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Acknowledge and resolve an active alert" })
  async resolveAlert(
    @Param("alertId") alertId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ResolveAlertDto,
  ) {
    const success = await this.alertService.resolveAlert(
      alertId,
      user.email || user.id,
      dto.notes,
    );
    return { success, alertId };
  }

  @Post("attempts/:attemptId/recover/review")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Step 1: Admin begins review of an auto-submitted attempt" })
  async initiateRecoveryReview(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const assessmentId = await this.monitoringService.resolveAssessmentId(attemptId);
    return this.recoveryService.initiateReview(
      assessmentId,
      attemptId,
      user.id,
      user.email,
    );
  }

  @Post("attempts/:attemptId/recover/authorize")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Step 2: Admin authorizes safe resume with restored checkpoint and grace time" })
  async authorizeResume(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AuthorizeResumeDto,
  ) {
    const assessmentId = await this.monitoringService.resolveAssessmentId(attemptId);
    return this.recoveryService.authorizeResume(
      assessmentId,
      attemptId,
      user.id,
      user.email,
      dto,
    );
  }

  @Post("attempts/:attemptId/extend-time")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin adds extra minutes to an active candidate attempt" })
  async extendTime(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ExtendTimeDto,
  ) {
    const assessmentId = await this.monitoringService.resolveAssessmentId(attemptId);
    return this.recoveryService.adminExtendTime(
      assessmentId,
      attemptId,
      user.id,
      user.email,
      dto,
    );
  }

  @Post("attempts/:attemptId/force-submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin emergency force submit an attempt" })
  async forceSubmit(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ForceSubmitDto,
  ) {
    const assessmentId = await this.monitoringService.resolveAssessmentId(attemptId);
    return this.recoveryService.adminForceSubmit(
      assessmentId,
      attemptId,
      user.id,
      user.email,
      dto,
    );
  }

  @Get("assessments/:id/coding-stats")
  @ApiOperation({ summary: "Retrieve coding execution and Judge0 worker telemetry" })
  async getCodingStats(@Param("id") assessmentId: string) {
    return this.codingService.getCodingStats(assessmentId);
  }
}
