import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { ExamConfigService } from "../services/exam-config.service";
import { ConfigPublisherService } from "../publishing/config-publisher.service";
import { ConfigVersionService } from "../versioning/config-version.service";
import { ConfigPreviewService } from "../services/config-preview.service";
import {
  CreateExamConfigDto,
  ValidateResponse,
  ExamConfigResponseSchema,
  ExamConfigListResponseSchema,
  UpdateExamConfigDto,
} from "@intervu/shared";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("admin-configs")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/configs")
export class ExamConfigController {
  constructor(
    private readonly examConfigService: ExamConfigService,
    private readonly configPublisher: ConfigPublisherService,
    private readonly configVersionService: ConfigVersionService,
    private readonly configPreviewService: ConfigPreviewService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(ExamConfigResponseSchema)
  @ApiOperation({ summary: "Create a new exam configuration" })
  @ApiBody({ type: CreateExamConfigDto })
  @ApiCreatedResponse({ description: "Configuration created successfully" })
  async create(
    @Body() dto: CreateExamConfigDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examConfigService.create(dto, user.id);
  }

  @Get()
  @ValidateResponse(ExamConfigListResponseSchema)
  @ApiOperation({ summary: "List all active exam configurations" })
  @ApiOkResponse({ description: "List of configurations" })
  async findAll() {
    return this.examConfigService.findAll();
  }

  @Get(":id")
  @ValidateResponse(ExamConfigResponseSchema)
  @ApiOperation({ summary: "Get a single exam configuration by ID" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Configuration details" })
  async findOne(@Param("id") id: string) {
    return this.examConfigService.findOne(id);
  }

  @Patch(":id")
  @ValidateResponse(ExamConfigResponseSchema)
  @ApiOperation({ summary: "Update an exam configuration" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiBody({ type: UpdateExamConfigDto })
  @ApiOkResponse({ description: "Configuration updated successfully" })
  async update(@Param("id") id: string, @Body() dto: UpdateExamConfigDto) {
    return this.examConfigService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(ExamConfigResponseSchema)
  @ApiOperation({ summary: "Archive an exam configuration" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Configuration archived successfully" })
  async archive(@Param("id") id: string) {
    return this.examConfigService.archive(id);
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  /**
   * POST /admin/configs/:id/validate
   * Runs full multi-layer + dependency validation.
   * Marks config as VALIDATED if all checks pass.
   */
  @Post(":id/validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate exam configuration (multi-layer + dependency check)",
  })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Validation result with errors and warnings" })
  async validate(@Param("id") id: string) {
    return this.configPublisher.validateOnly(id);
  }

  // ─── Publishing ────────────────────────────────────────────────────────────

  /**
   * POST /admin/configs/:id/publish
   * Full publish flow: Validate → Snapshot → Version → PUBLISHED status.
   * Blocks if any validation errors are present.
   */
  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Publish a validated exam configuration",
  })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Publish result with version and timestamp" })
  async publish(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.configPublisher.publish(id, user.id);
  }

  // ─── Preview ───────────────────────────────────────────────────────────────

  /**
   * GET /admin/configs/:id/preview
   * Returns downstream impact preview: sections, questions, difficulty split.
   */
  @Get(":id/preview")
  @ApiOperation({ summary: "Preview exam configuration downstream impact" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({
    description: "Preview with sections, questions, difficulty",
  })
  async preview(@Param("id") id: string) {
    return this.configPreviewService.getPreview(id);
  }

  // ─── Versioning ────────────────────────────────────────────────────────────

  /**
   * POST /admin/configs/:id/version
   * Manually create a version snapshot of the current config state.
   */
  @Post(":id/version")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a manual version snapshot" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiCreatedResponse({ description: "Version entry created" })
  async createVersion(@Param("id") id: string) {
    return this.configVersionService.createVersionFromId(id);
  }

  /**
   * GET /admin/configs/:id/versions
   * List all version history entries for a config.
   */
  @Get(":id/versions")
  @ApiOperation({ summary: "List all versions of an exam configuration" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "List of version entries" })
  async getVersions(@Param("id") id: string) {
    return this.configVersionService.getVersions(id);
  }

  /**
   * POST /admin/configs/:id/restore/:versionId
   * Restore a config to a previous version's state.
   * Resets status to DRAFT to force re-validation.
   */
  @Post(":id/restore/:versionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Restore configuration to a previous version" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiParam({ name: "versionId", description: "Version entry ID to restore" })
  @ApiOkResponse({ description: "Restore result" })
  async restoreVersion(
    @Param("id") id: string,
    @Param("versionId") versionId: string,
  ) {
    return this.configVersionService.restoreVersion(id, versionId);
  }
}
