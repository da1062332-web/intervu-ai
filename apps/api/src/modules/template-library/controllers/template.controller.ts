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
  ApiProperty,
  ApiPropertyOptional,
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
  CreateSolutionTemplateRequest,
  UpdateSolutionTemplateRequest,
  GenerateTemplatePreviewRequest,
  SolutionTemplateBaseSchema,
  TemplatePreviewBaseSchema,
  NullableSolutionTemplateBaseSchema,
  NullableTemplatePreviewBaseSchema,
} from "@intervu/shared";
import { TemplateService } from "../services/template.service";
import { SolutionTemplateService } from "../services/solution-template.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

class SaveQuestionDefinitionDto {
  @ApiProperty({
    example: "A product is priced at {{price}} USD. The tax is {{tax}} USD. What is the total price?",
    description: "Question template definition with placeholders",
  })
  questionTemplate!: string;
}

class SaveOptionStrategyDto {
  @ApiProperty({
    example: ["{{C}}", "{{opt1}}", "{{opt2}}"],
    description: "Option templates array with placeholders",
  })
  optionsTemplate!: string[];

  @ApiPropertyOptional({
    enum: ["VARIABLE", "DATASET", "HYBRID"],
    example: "DATASET",
    description: "Template generation strategy",
  })
  strategy?: "VARIABLE" | "DATASET" | "HYBRID";

  @ApiPropertyOptional({
    example: "dataset-cuid-123",
    description: "Associated dataset library ID",
  })
  datasetId?: string;

  @ApiPropertyOptional({
    example: "scenario-cuid-123",
    description: "Associated scenario config ID",
  })
  scenarioId?: string;
}

@ApiTags("templates")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("templates")
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly solutionTemplateService: SolutionTemplateService,
  ) {}

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

  @Post(":id/solution")
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(SolutionTemplateBaseSchema)
  @ApiOperation({ summary: "Create a solution template" })
  @ApiParam({ name: "id", description: "Template ID" })
  @ApiBody({ type: CreateSolutionTemplateRequest })
  async createSolutionTemplate(
    @Param("id") id: string,
    @Body() dto: CreateSolutionTemplateRequest,
  ) {
    return this.solutionTemplateService.createSolutionTemplate(id, dto);
  }

  @Get(":id/solution")
  @ValidateResponse(NullableSolutionTemplateBaseSchema)
  @ApiOperation({ summary: "Get solution template" })
  @ApiParam({ name: "id", description: "Template ID" })
  async getSolutionTemplate(@Param("id") id: string) {
    return this.solutionTemplateService.getSolutionTemplate(id);
  }

  @Patch(":id/solution")
  @ValidateResponse(SolutionTemplateBaseSchema)
  @ApiOperation({ summary: "Update solution template" })
  @ApiParam({ name: "id", description: "Template ID" })
  @ApiBody({ type: UpdateSolutionTemplateRequest })
  async updateSolutionTemplate(
    @Param("id") id: string,
    @Body() dto: UpdateSolutionTemplateRequest,
  ) {
    return this.solutionTemplateService.updateSolutionTemplate(id, dto);
  }

  @Post(":id/preview")
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(TemplatePreviewBaseSchema)
  @ApiOperation({ summary: "Generate template preview" })
  @ApiParam({ name: "id", description: "Template ID" })
  @ApiBody({ type: GenerateTemplatePreviewRequest })
  async generatePreview(
    @Param("id") id: string,
    @Body() dto: GenerateTemplatePreviewRequest,
  ) {
    return this.solutionTemplateService.generatePreview(id, dto);
  }

  @Get(":id/preview")
  @ValidateResponse(NullableTemplatePreviewBaseSchema)
  @ApiOperation({ summary: "Get latest template preview" })
  @ApiParam({ name: "id", description: "Template ID" })
  async getLatestPreview(@Param("id") id: string) {
    return this.solutionTemplateService.getLatestPreview(id);
  }

  @Post(":id/generate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate one question from a template and store it in the pool",
  })
  @ApiParam({ name: "id", description: "Template ID" })
  async generateQuestion(@Param("id") id: string) {
    return this.templateService.generateQuestionForTemplate(id);
  }

  @Post(":id/generate-batch")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Generate questions in batch from a template and store in pool",
  })
  @ApiParam({ name: "id", description: "Template ID" })
  async generateQuestionBatch(
    @Param("id") id: string,
    @Body() body: { count: number; saveToPool?: boolean },
  ) {
    const count = body.count || 10;
    const saveToPool = body.saveToPool !== undefined ? body.saveToPool : true;
    return this.templateService.generateBatchForTemplate(id, count, saveToPool);
  }

  @Get(":id/question")
  @ApiOperation({ summary: "Load question template definition" })
  @ApiParam({ name: "id", description: "Template ID" })
  async getQuestionDefinition(@Param("id") id: string) {
    const template = await this.templateService.findById(id);
    const structure = (template.structure as any) || {};
    return {
      templateId: template.id,
      questionTemplate: structure.questionTemplate || "",
    };
  }

  @Post(":id/question")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Save question template definition" })
  @ApiParam({ name: "id", description: "Template ID" })
  async saveQuestionDefinition(
    @Param("id") id: string,
    @Body() body: SaveQuestionDefinitionDto,
  ) {
    const template = await this.templateService.findById(id);
    const structure = (template.structure as any) || {};
    const updatedStructure = {
      ...structure,
      questionTemplate: body.questionTemplate,
    };
    return this.templateService.update(id, {
      structure: updatedStructure as any,
    });
  }

  @Patch(":id/question")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update question template definition" })
  @ApiParam({ name: "id", description: "Template ID" })
  async patchQuestionDefinition(
    @Param("id") id: string,
    @Body() body: SaveQuestionDefinitionDto,
  ) {
    return this.saveQuestionDefinition(id, body);
  }

  @Get(":id/options")
  @ApiOperation({ summary: "Load option strategy template" })
  @ApiParam({ name: "id", description: "Template ID" })
  async getOptionStrategy(@Param("id") id: string) {
    const template = await this.templateService.findById(id);
    const structure = (template.structure as any) || {};

    let datasetId: string | null = null;
    if (template.generationStrategy === "DATASET") {
      const dbConfig = await this.templateService.findDatasetConfig(template.id);
      if (dbConfig) {
        datasetId = dbConfig.datasetId;
      }
    }

    return {
      templateId: template.id,
      optionsTemplate: structure.optionsTemplate || [],
      strategy: template.generationStrategy || "VARIABLE",
      datasetId: datasetId,
      scenarioId: null,
    };
  }

  @Post(":id/options")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Save option strategy template" })
  @ApiParam({ name: "id", description: "Template ID" })
  async saveOptionStrategy(
    @Param("id") id: string,
    @Body() body: SaveOptionStrategyDto,
  ) {
    const template = await this.templateService.findById(id);
    const structure = (template.structure as any) || {};
    const updatedStructure = {
      ...structure,
      optionsTemplate: body.optionsTemplate,
    };

    const updatePayload: any = {
      structure: updatedStructure as any,
    };

    if (body.strategy) {
      updatePayload.generationStrategy = body.strategy;
    }

    const updatedTemplate = await this.templateService.update(id, updatePayload);

    if (body.strategy === "DATASET" && body.datasetId) {
      await this.templateService.upsertDatasetConfig(id, body.datasetId);
    }

    return updatedTemplate;
  }

  @Patch(":id/options")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update option strategy template" })
  @ApiParam({ name: "id", description: "Template ID" })
  async patchOptionStrategy(
    @Param("id") id: string,
    @Body() body: SaveOptionStrategyDto,
  ) {
    return this.saveOptionStrategy(id, body);
  }
}
