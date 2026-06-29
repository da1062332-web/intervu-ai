import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AssemblyService } from "../services/test-assembly.service";
import { AssemblyPersistenceService } from "../services/assembly-persistence.service";
import { AssemblyVersionService } from "../services/assembly-version.service";
import { DistributionAnalyticsService } from "../services/distribution-analytics.service";
import { AssemblyPublisherService } from "../services/assembly-publisher.service";
import { AssemblyRepository } from "../repositories/assembly.repository";
import {
  CreateAssemblyDto,
  AssemblyBuildResponseDto,
  AssemblyResponseDto,
  SaveAssemblyRequestDto,
} from "@intervu/shared";
import {
  UserRole,
} from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

@ApiTags("Assembly Engine")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("assembly")
export class AssemblyController {
  constructor(
    private readonly assemblyService: AssemblyService,
    private readonly persistenceService: AssemblyPersistenceService,
    private readonly versionService: AssemblyVersionService,
    private readonly analyticsService: DistributionAnalyticsService,
    private readonly publisherService: AssemblyPublisherService,
    private readonly assemblyRepository: AssemblyRepository,
  ) {}

  // --- NEW ROUTES ---
  @Post("tests/generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Build a new Test Instance from a Config" })
  @ApiResponse({ status: 201, type: AssemblyBuildResponseDto })
  async generateAssemblyNew(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AssemblyBuildResponseDto> {
    const testInstanceId = await this.assemblyService.assembleTest(
      dto.configId,
      user.id,
    );

    return {
      success: true,
      data: { testInstanceId },
      error: null,
      meta: null,
    };
  }

  @Get("tests/:id/preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Dry-run preview of a Test Instance assembly" })
  @ApiResponse({ status: 200 })
  async previewAssemblyNew(
    @Param("id") configId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const preview = await this.assemblyService.previewTest(configId, user.id);
    return {
      success: true,
      data: preview,
      error: null,
      meta: null,
    };
  }

  @Post("tests/:id/validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate an assembly configuration without throwing exceptions",
  })
  @ApiResponse({ status: 200 })
  async validateAssemblyNew(
    @Param("id") configId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const validation = await this.assemblyService.validateTest(
      configId,
      user.id,
    );
    return {
      success: true,
      data: validation,
      error: null,
      meta: null,
    };
  }

  @Post("save")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Save an assembled test" })
  @ApiResponse({ status: 201 })
  async saveAssembly(
    @Body() dto: SaveAssemblyRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    const assemblyId = await this.persistenceService.saveAssembly(
      dto.configId,
      [], // Assuming frontend passes sections in a larger DTO, or we fetch from Blueprint builder.
      // Wait, SaveAssemblyRequestDto currently only takes configId.
      user.id,
    );
    return { success: true, data: { assemblyId } };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete an assembled test" })
  async deleteAssembly(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.persistenceService.deleteAssembly(id, user.id);
  }

  @Post(":id/version")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a version snapshot of an assembly" })
  async createVersion(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const version = await this.versionService.createVersion(id, user.id);
    return { success: true, data: version };
  }

  @Get(":id/versions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List versions of an assembly" })
  async listVersions(@Param("id") id: string) {
    const versions = await this.versionService.listVersions(id);
    return { success: true, data: versions };
  }

  @Post(":id/restore/:versionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Restore an assembly to a specific version" })
  async restoreVersion(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const restored = await this.versionService.restoreVersion(id, versionId, user.id);
    return { success: true, data: restored };
  }

  @Get(":id/analytics")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get analytics for an assembly" })
  async getAnalytics(@Param("id") id: string) {
    const analytics = await this.analyticsService.buildAnalytics(id);
    return { success: true, data: analytics };
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Publish an assembly" })
  async publishAssembly(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const published = await this.publisherService.publishAssembly(id, user.id);
    return { success: true, data: published };
  }

  // --- DEPRECATED ROUTES ---
  @Post("generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Build a new Test Instance from a Config",
    deprecated: true,
  })
  @ApiResponse({ status: 201, type: AssemblyBuildResponseDto })
  /** @deprecated Use /tests/generate instead */
  async generateAssembly(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AssemblyBuildResponseDto> {
    return this.generateAssemblyNew(dto, user);
  }

  @Post("preview")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dry-run preview of a Test Instance assembly",
    deprecated: true,
  })
  @ApiResponse({ status: 200 })
  /** @deprecated Use /tests/:id/preview instead */
  async previewAssembly(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.previewAssemblyNew(dto.configId, user);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.CANDIDATE)
  @ApiOperation({ summary: "Get an assembled Test Instance (AssembledTest or TestInstance)" })
  @ApiResponse({ status: 200 })
  async getAssembly(@Param("id") id: string) {
    // Try AssembledTest table first (from POST /assembly/save or POST /assembly/tests/generate flow)
    let instance: any = null;
    let sourceTable: "assembledTest" | "testInstance" = "assembledTest";

    try {
      instance = await this.persistenceService.getAssembly(id);
    } catch {
      // Fall back to TestInstance table (created by POST /assembly/tests/generate)
      instance = await this.assemblyRepository.findById(id);
      sourceTable = "testInstance";
    }

    if (!instance) {
      throw new NotFoundException(`Assembly or TestInstance with ID ${id} not found`);
    }

    const data: AssemblyResponseDto = {
      id: instance.id,
      configId: instance.configId ?? instance.testConfigId,
      status: instance.status ?? "CREATED",
      totalDurationSeconds: instance.totalDurationSeconds ??
        (instance.sections?.reduce((acc: number, s: any) => acc + (s.durationSeconds ?? 0), 0) ?? 0),
      totalQuestions: instance.totalQuestions ??
        (instance.sections?.reduce((acc: number, s: any) => acc + (s.questions?.length ?? 0), 0) ?? 0),
      createdAt: instance.createdAt.toISOString(),
      updatedAt: instance.updatedAt.toISOString(),
      sections: (instance.sections ?? []).map((s: any) => ({
        sectionKey: s.sectionKey,
        displayName: s.sectionName ?? s.displayName,
        durationSeconds: s.durationSeconds,
        questionCount: s.questionCount ?? s.questions?.length ?? 0,
        orderIndex: s.orderIndex ?? 0,
        questions: (s.questions ?? []).map((q: any) => {
          const snap = (q.questionSnapshot ?? {}) as Record<string, unknown>;
          return {
            questionId: q.questionId,
            questionHash: (snap?.questionHash as string) || "",
            conceptKey: (snap?.conceptKey as string) || "",
            difficultyLevel: (snap?.difficultyLevel as string) || "MEDIUM",
            questionType: (snap?.questionType as string) || "MULTIPLE_CHOICE",
            questionOrder: q.questionOrder,
            questionSnapshot: q.questionSnapshot,
          };
        }),
      })),
    };

    return {
      success: true,
      data,
      error: null,
      meta: null,
    };
  }
}
