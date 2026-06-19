import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { DifficultyDistributionService } from "../services/difficulty-distribution.service";
import {
  UpdateDifficultyDistributionDto,
  ValidateResponse,
  DifficultyDistributionResponseSchema,
  ZodValidationPipe,
  UpdateDifficultyDistributionSchema,
} from "@intervu/shared";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("difficulty-distribution")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/configs/:id/difficulty")
export class DifficultyDistributionController {
  constructor(private readonly service: DifficultyDistributionService) {}

  @Post()
  @ValidateResponse(DifficultyDistributionResponseSchema)
  @ApiOperation({
    summary: "Create difficulty distribution for an exam config",
  })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiBody({ type: UpdateDifficultyDistributionDto })
  @ApiOkResponse({
    description: "Difficulty distribution created successfully",
  })
  async create(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateDifficultyDistributionSchema))
    dto: UpdateDifficultyDistributionDto,
  ) {
    return this.service.updateDifficultyDistribution(id, dto);
  }

  @Patch()
  @ValidateResponse(DifficultyDistributionResponseSchema)
  @ApiOperation({
    summary: "Update difficulty distribution for an exam config",
  })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiBody({ type: UpdateDifficultyDistributionDto })
  @ApiOkResponse({
    description: "Difficulty distribution updated successfully",
  })
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateDifficultyDistributionSchema))
    dto: UpdateDifficultyDistributionDto,
  ) {
    return this.service.updateDifficultyDistribution(id, dto);
  }

  @Put()
  @ValidateResponse(DifficultyDistributionResponseSchema)
  @ApiOperation({
    summary: "Update difficulty distribution for an exam config using PUT",
  })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiBody({ type: UpdateDifficultyDistributionDto })
  @ApiOkResponse({
    description: "Difficulty distribution updated successfully",
  })
  async updatePut(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateDifficultyDistributionSchema))
    dto: UpdateDifficultyDistributionDto,
  ) {
    return this.service.updateDifficultyDistribution(id, dto);
  }

  @Get()
  @ValidateResponse(DifficultyDistributionResponseSchema)
  @ApiOperation({ summary: "Get difficulty distribution for an exam config" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Difficulty distribution details" })
  async findOne(@Param("id") id: string) {
    const distribution = await this.service.getDifficultyDistribution(id);
    if (!distribution) {
      throw new NotFoundException({
        code: "DISTRIBUTION_NOT_FOUND",
        message: "Difficulty distribution not found for this config",
      });
    }
    return distribution;
  }
}
