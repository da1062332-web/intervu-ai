import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from "@nestjs/swagger";
import { DifficultyLevel, UserRole } from "@prisma/client";

import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateValidationRequestDto,
} from "@intervu/shared";
import {
  ValidateResponse,
  TemplateSchema,
  TemplateListSchema,
  TemplatePaginatedSchema,
  TemplateVersionSchema,
  TemplateRemoveSchema,
  TemplateValidationResponseSchema,
} from "@intervu/shared";
import { TemplateService } from "../services/template.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("templates")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("templates")
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @ValidateResponse(TemplatePaginatedSchema)
  @ApiOperation({ summary: "List all templates (paginated)" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiQuery({ name: "difficulty", required: false, enum: DifficultyLevel })
  @ApiOkResponse({ description: "Paginated list of templates" })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("difficulty") difficulty?: DifficultyLevel,
  ) {
    return this.templateService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      difficulty,
    );
  }

  @Get("system")
  @ValidateResponse(TemplateListSchema)
  @ApiOperation({ summary: "Get all system-managed templates" })
  @ApiOkResponse({ description: "List of system templates" })
  async findSystemTemplates() {
    return this.templateService.findSystemTemplates();
  }

  @Get("difficulty/:level")
  @ValidateResponse(TemplateListSchema)
  @ApiOperation({ summary: "Get templates filtered by difficulty level" })
  @ApiParam({
    name: "level",
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM,
  })
  @ApiOkResponse({ description: "Templates for given difficulty" })
  async findByDifficulty(@Param("level") level: DifficultyLevel) {
    return this.templateService.findByDifficulty(level);
  }

  @Get(":id")
  @ValidateResponse(TemplateSchema)
  @ApiOperation({ summary: "Get a single template by ID" })
  @ApiParam({
    name: "id",
    example: "cmbk1xyz0000abc123",
    description: "Template CUID",
  })
  @ApiOkResponse({ description: "Template record" })
  async findOne(@Param("id") id: string) {
    return this.templateService.findById(id);
  }

  @Get(":id/version")
  @ValidateResponse(TemplateVersionSchema)
  @ApiOperation({ summary: "Get version metadata for a template" })
  @ApiParam({
    name: "id",
    example: "cmbk1xyz0000abc123",
    description: "Template CUID",
  })
  @ApiOkResponse({ description: "Template version token (id + updatedAt)" })
  async getVersion(@Param("id") id: string) {
    return this.templateService.getVersion(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(TemplateSchema)
  @ApiOperation({ summary: "Create a new template" })
  @ApiBody({
    type: CreateTemplateDto,
    description: "Template creation payload",
  })
  @ApiCreatedResponse({ description: "Template created successfully" })
  async create(@Body() dto: CreateTemplateDto) {
    return this.templateService.create(dto);
  }

  @Patch(":id")
  @ValidateResponse(TemplateSchema)
  @ApiOperation({ summary: "Update an existing template" })
  @ApiParam({
    name: "id",
    example: "cmbk1xyz0000abc123",
    description: "Template CUID",
  })
  @ApiBody({ type: UpdateTemplateDto, description: "Template update payload" })
  @ApiOkResponse({ description: "Template updated successfully" })
  async update(@Param("id") id: string, @Body() dto: UpdateTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(TemplateRemoveSchema)
  @ApiOperation({ summary: "Soft-delete a template by ID" })
  @ApiParam({
    name: "id",
    example: "cmbk1xyz0000abc123",
    description: "Template CUID",
  })
  @ApiOkResponse({ description: "Template soft-deleted successfully" })
  async remove(@Param("id") id: string) {
    return this.templateService.remove(id);
  }

  @Post(":id/validate")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(TemplateValidationResponseSchema)
  @ApiOperation({ summary: "Validate template variables & constraints" })
  @ApiParam({ name: "id", description: "Template ID" })
  @ApiBody({ type: TemplateValidationRequestDto })
  @ApiOkResponse({ description: "Validation results" })
  async validateTemplate(
    @Param("id") id: string,
    @Body() dto: TemplateValidationRequestDto,
  ) {
    return this.templateService.validateTemplate(id, dto.values);
  }
}
