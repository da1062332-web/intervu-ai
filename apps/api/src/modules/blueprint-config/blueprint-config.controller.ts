import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { BlueprintConfigService } from "./blueprint-config.service";
import {
  CreateBlueprintConfigDto,
  UpdateBlueprintConfigDto,
  AddTopicConfigDto,
} from "@intervu/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

import { BlueprintValidatorService } from "./blueprint-validator.service";

@ApiTags("admin-blueprints")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/blueprints")
export class BlueprintConfigController {
  constructor(
    private readonly service: BlueprintConfigService,
    private readonly validator: BlueprintValidatorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new blueprint configuration" })
  @ApiBody({ type: CreateBlueprintConfigDto })
  async create(@Body() dto: CreateBlueprintConfigDto) {
    const blueprint = await this.service.create(dto);
    return {
      success: true,
      data: blueprint,
      error: null,
      meta: {},
    };
  }

  @Get()
  @ApiOperation({ summary: "List all blueprint configurations" })
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
  @ApiOperation({ summary: "Get blueprint configuration details" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  async findOne(@Param("id") id: string) {
    const blueprint = await this.service.findById(id);

    // Map to Detail Response API
    const topics = blueprint.topicConfigs.map((tc) => ({
      topicName: tc.topic.name,
      sectionName: tc.examSection?.name || "Uncategorized",
      questionCount: tc.questionCount,
      weightage: tc.weightage,
      difficultyDistribution: {
        easyCount: tc.easyCount,
        mediumCount: tc.mediumCount,
        hardCount: tc.hardCount,
      },
    }));

    const validationSummary = this.validator.validateBlueprintOverall(
      blueprint,
      blueprint.topicConfigs,
    );

    return {
      success: true,
      data: {
        id: blueprint.id,
        name: blueprint.name,
        totalQuestions: blueprint.totalQuestions,
        durationMinutes: blueprint.totalDurationMinutes,
        valid: validationSummary.valid,
        validationSummary: validationSummary,
        topics: topics,
      },
      error: null,
      meta: {},
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update blueprint configuration" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiBody({ type: UpdateBlueprintConfigDto })
  async update(@Param("id") id: string, @Body() dto: UpdateBlueprintConfigDto) {
    const blueprint = await this.service.update(id, dto);
    return {
      success: true,
      data: blueprint,
      error: null,
      meta: {},
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft delete a blueprint configuration" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  async softDelete(@Param("id") id: string) {
    await this.service.softDelete(id);
    return {
      success: true,
      data: { id },
      error: null,
      meta: {},
    };
  }

  @Post(":id/topics")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a topic to a blueprint configuration" })
  @ApiParam({ name: "id", description: "Blueprint ID" })
  @ApiBody({ type: AddTopicConfigDto })
  async addTopicConfig(
    @Param("id") id: string,
    @Body() dto: AddTopicConfigDto,
  ) {
    const config = await this.service.addTopicConfig(id, dto);
    return {
      success: true,
      data: config,
      error: null,
      meta: {},
    };
  }
}
