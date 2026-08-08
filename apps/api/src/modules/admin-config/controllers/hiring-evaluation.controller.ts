import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { HiringEvaluationService } from "../services/hiring-evaluation.service";

@ApiTags("admin-configs")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class HiringEvaluationController {
  constructor(
    private readonly hiringEvaluationService: HiringEvaluationService,
  ) {}

  @Get("hiring-strategies")
  @ApiOperation({
    summary: "Get all saved hiring evaluation strategies and threshold presets",
  })
  @ApiOkResponse({
    description: "List of saved evaluation strategies and presets",
  })
  async getSavedStrategies() {
    return this.hiringEvaluationService.getAllSavedStrategies();
  }

  @Get("configs/:id/hiring-evaluation")
  @ApiOperation({
    summary: "Get hiring evaluation configuration for an exam config",
  })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Hiring evaluation configuration details" })
  async getHiringConfig(@Param("id") id: string) {
    return this.hiringEvaluationService.getConfig(id);
  }

  @Patch("configs/:id/hiring-evaluation")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update hiring evaluation configuration and section mappings",
  })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({
    description: "Hiring evaluation configuration updated successfully",
  })
  async updateHiringConfig(@Param("id") id: string, @Body() dto: any) {
    return this.hiringEvaluationService.upsertConfig(id, dto);
  }
}
