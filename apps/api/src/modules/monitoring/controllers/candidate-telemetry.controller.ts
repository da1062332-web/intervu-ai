import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { UserRole } from "@prisma/client";
import { LiveMonitoringService } from "../services/live-monitoring.service";
import { ProctoringMonitoringService } from "../services/proctoring-monitoring.service";
import { AttemptRecoveryService } from "../services/attempt-recovery.service";
import {
  CandidateHeartbeatDto,
  CandidateProctoringTelemetryDto,
} from "../dto/monitoring.dto";
import { PrismaService } from "../../../prisma/prisma.service";

@ApiTags("Candidate Telemetry")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Controller("tests")
export class CandidateTelemetryController {
  constructor(
    private readonly monitoringService: LiveMonitoringService,
    private readonly proctoringService: ProctoringMonitoringService,
    private readonly recoveryService: AttemptRecoveryService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAttemptOwnership(attemptId: string, user: AuthUser) {
    if (user.role === UserRole.ADMIN) return;

    const meta = await this.monitoringService.getAttemptMetadata(attemptId);
    if (!meta || !meta.userId) {
      throw new NotFoundException(`Test instance ${attemptId} not found`);
    }

    if (meta.userId !== user.id) {
      throw new ForbiddenException("You do not own this test session");
    }
  }

  @Post(":id/heartbeat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Candidate sends periodic heartbeat and live telemetry" })
  @ApiParam({ name: "id", description: "TestInstance ID" })
  async sendHeartbeat(
    @Param("id") attemptId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CandidateHeartbeatDto,
  ) {
    await this.assertAttemptOwnership(attemptId, user);
    return this.monitoringService.recordHeartbeat(attemptId, user.id, dto);
  }

  @Post(":id/telemetry/proctoring")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Candidate transmits real-time proctoring event and violation detection" })
  @ApiParam({ name: "id", description: "TestInstance ID" })
  async sendProctoringEvent(
    @Param("id") attemptId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CandidateProctoringTelemetryDto,
  ) {
    await this.assertAttemptOwnership(attemptId, user);
    return this.proctoringService.handleProctoringEvent(attemptId, user.id, dto);
  }

  @Get(":id/recovery-status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Candidate checks if proctor has authorized recovery/resume after interruption (read-only)" })
  @ApiParam({ name: "id", description: "TestInstance ID" })
  async getRecoveryStatus(
    @Param("id") attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertAttemptOwnership(attemptId, user);
    return this.recoveryService.getRecoveryStatus(attemptId, user.id);
  }

  @Post(":id/recovery/resume")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Candidate confirms resume handshake after proctor authorization" })
  @ApiParam({ name: "id", description: "TestInstance ID" })
  async confirmResume(
    @Param("id") attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertAttemptOwnership(attemptId, user);
    return this.recoveryService.confirmCandidateResumed(attemptId, user.id);
  }
}
