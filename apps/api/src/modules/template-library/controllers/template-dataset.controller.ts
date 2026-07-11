import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { UpdateTemplateDatasetConfigDto } from "@intervu/shared";
import {
  ValidateResponse,
  TemplateDatasetConfigResponseSchema,
} from "@intervu/shared";
import { TemplateDatasetService } from "../services/template-dataset.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("template-dataset-configs")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller()
export class TemplateDatasetController {
  constructor(
    private readonly templateDatasetService: TemplateDatasetService,
  ) {}

  @Get("templates/:templateId/dataset")
  @ValidateResponse(TemplateDatasetConfigResponseSchema)
  @ApiOperation({ summary: "Get dataset configuration for a template" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiOkResponse({ description: "Template dataset configuration details" })
  async getDatasetConfig(@Param("templateId") templateId: string) {
    const config =
      await this.templateDatasetService.getDatasetConfig(templateId);
    return { success: true, data: config, error: null, meta: null };
  }

  @Patch("templates/:templateId/dataset")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(TemplateDatasetConfigResponseSchema)
  @ApiOperation({ summary: "Save dataset configuration for a template" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiBody({ type: UpdateTemplateDatasetConfigDto })
  @ApiOkResponse({ description: "Dataset configuration saved successfully" })
  async saveDatasetConfig(
    @Param("templateId") templateId: string,
    @Body() dto: UpdateTemplateDatasetConfigDto,
  ) {
    const config = await this.templateDatasetService.saveDatasetConfig(
      templateId,
      dto,
    );
    return { success: true, data: config, error: null, meta: null };
  }
}
