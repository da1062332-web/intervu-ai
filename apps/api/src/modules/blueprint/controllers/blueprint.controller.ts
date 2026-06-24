import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { BlueprintService } from "../services/blueprint.service";
import { BlueprintCompilerService } from "../services/blueprint-compiler.service";
import { CreateBlueprintDto, UpdateBlueprintDto } from "@intervu/shared";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("blueprints")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("blueprints")
export class BlueprintController {
  constructor(
    private readonly service: BlueprintService,
    private readonly compilerService: BlueprintCompilerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create or update blueprint for exam configuration",
  })
  @ApiBody({ type: CreateBlueprintDto })
  @ApiCreatedResponse({ description: "Blueprint created/updated successfully" })
  async create(@Body() dto: CreateBlueprintDto) {
    const blueprint = await this.service.create(dto);
    return {
      success: true,
      data: blueprint,
      error: null,
      meta: {},
    };
  }

  @Get()
  @ApiOperation({ summary: "List all blueprints" })
  @ApiOkResponse({ description: "List of blueprints" })
  async findAll() {
    const blueprints = await this.service.findAll();
    return {
      success: true,
      data: blueprints,
      error: null,
      meta: {},
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single blueprint by ID" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiOkResponse({ description: "Blueprint details" })
  async findOne(@Param("id") id: string) {
    const blueprint = await this.service.findOne(id);
    return {
      success: true,
      data: blueprint,
      error: null,
      meta: {},
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a blueprint by ID" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiBody({ type: UpdateBlueprintDto })
  @ApiOkResponse({ description: "Blueprint updated successfully" })
  async update(@Param("id") id: string, @Body() dto: UpdateBlueprintDto) {
    const blueprint = await this.service.update(id, dto);
    return {
      success: true,
      data: blueprint,
      error: null,
      meta: {},
    };
  }

  @Post(":id/validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate blueprint configuration" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiOkResponse({ description: "Validation result" })
  async validate(@Param("id") id: string) {
    const result = await this.service.validate(id);
    return {
      success: true,
      data: result,
      error: null,
      meta: {},
    };
  }

  @Get(":id/preview")
  @ApiOperation({ summary: "Generate structural blueprint preview" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiOkResponse({ description: "Blueprint preview data" })
  async preview(@Param("id") id: string) {
    const result = await this.service.preview(id);
    return {
      success: true,
      data: result,
      error: null,
      meta: {},
    };
  }

  @Post(":id/compile")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Compile blueprint into generation requests" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiOkResponse({ description: "Compilation result batch details" })
  async compile(@Param("id") id: string) {
    const result = await this.compilerService.compileBlueprint(id);
    return {
      success: true,
      data: {
        batchId: result.batchId,
        requestCount: result.requests.reduce(
          (sum: number, r: { quantity: number }) => sum + r.quantity,
          0,
        ),
      },
      error: null,
      meta: {},
    };
  }

  @Get(":id/compilation-preview")
  @ApiOperation({
    summary: "Preview compilation sections breakdown and requests",
  })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiOkResponse({ description: "Compilation preview data" })
  async compilationPreview(@Param("id") id: string) {
    const result = await this.compilerService.previewCompilation(id);
    return {
      success: true,
      data: result,
      error: null,
      meta: {},
    };
  }

  @Get(":id/compilation-health")
  @ApiOperation({ summary: "Fetch compilation health status" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiOkResponse({ description: "Compilation health data" })
  async compilationHealth(@Param("id") id: string) {
    const result = await this.compilerService.validateCompilation(id);
    const hasTemplatesError = result.errors.some((e) =>
      e.includes("No Templates Found"),
    );
    const hasConceptsError = result.errors.some((e) =>
      e.includes("No Concepts Found"),
    );
    const hasReadinessError = result.errors.some((e) =>
      e.includes("Readiness Not READY"),
    );
    const hasBlueprintError = result.errors.some((e) =>
      e.includes("Blueprint Invalid"),
    );

    return {
      success: true,
      data: {
        valid: result.valid,
        checks: {
          templatesAvailable: {
            status: hasTemplatesError ? "FAIL" : "PASS",
            message: hasTemplatesError
              ? "Some allocated topic-difficulties lack templates"
              : "All topic-difficulties have active templates",
          },
          conceptsAvailable: {
            status: hasConceptsError ? "FAIL" : "PASS",
            message: hasConceptsError
              ? "Some allocated topics lack active concepts"
              : "All topics have active concepts",
          },
          difficultyCoverage: {
            status: hasBlueprintError ? "FAIL" : "PASS",
            message: hasBlueprintError
              ? "Blueprint configuration is invalid"
              : "Difficulty distribution matches configurations",
          },
          generationReady: {
            status: hasReadinessError ? "FAIL" : "PASS",
            message: hasReadinessError
              ? "Exam configuration is not ready for generation"
              : "Exam configuration readiness audit passed",
          },
        },
        errors: result.errors,
      },
      error: null,
      meta: {},
    };
  }
}
