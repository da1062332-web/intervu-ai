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
  constructor(private readonly service: BlueprintService) {}

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
}
