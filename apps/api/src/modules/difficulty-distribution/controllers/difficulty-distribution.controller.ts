import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
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
@Controller("admin/configs/:configId/difficulty-distribution")
export class DifficultyDistributionController {
  constructor(private readonly service: DifficultyDistributionService) {}

  @Put()
  @ValidateResponse(DifficultyDistributionResponseSchema)
  @ApiOperation({ summary: "Update or create difficulty distribution for an exam config" })
  @ApiParam({ name: "configId", description: "Exam configuration ID (UUID)" })
  @ApiOkResponse({ description: "Difficulty distribution updated successfully" })
  async update(
    @Param("configId", ParseUUIDPipe) configId: string,
    @Body(new ZodValidationPipe(UpdateDifficultyDistributionSchema)) dto: UpdateDifficultyDistributionDto,
  ) {
    return this.service.updateDifficultyDistribution(configId, dto);
  }

  @Get()
  @ValidateResponse(DifficultyDistributionResponseSchema)
  @ApiOperation({ summary: "Get difficulty distribution for an exam config" })
  @ApiParam({ name: "configId", description: "Exam configuration ID (UUID)" })
  @ApiOkResponse({ description: "Difficulty distribution details" })
  async findOne(@Param("configId", ParseUUIDPipe) configId: string) {
    const distribution = await this.service.getDifficultyDistribution(configId);
    if (!distribution) {
      throw new NotFoundException({
        code: "DISTRIBUTION_NOT_FOUND",
        message: "Difficulty distribution not found for this config",
      });
    }
    return distribution;
  }
}
