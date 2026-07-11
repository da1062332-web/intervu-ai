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

import { UpdateTemplatePromptConfigDto } from "@intervu/shared";
import {
  ValidateResponse,
  TemplatePromptConfigResponseSchema,
} from "@intervu/shared";
import { TemplatePromptService } from "../services/template-prompt.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("template-prompt-configs")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller()
export class TemplatePromptController {
  constructor(private readonly templatePromptService: TemplatePromptService) {}

  @Get("templates/:templateId/prompt")
  @ValidateResponse(TemplatePromptConfigResponseSchema)
  @ApiOperation({ summary: "Get prompt configuration for a template" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiOkResponse({ description: "Template prompt configuration details" })
  async getPromptConfig(@Param("templateId") templateId: string) {
    const config = await this.templatePromptService.getPromptConfig(templateId);
    return { success: true, data: config, error: null, meta: null };
  }

  @Patch("templates/:templateId/prompt")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(TemplatePromptConfigResponseSchema)
  @ApiOperation({ summary: "Save prompt configuration for a template" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiBody({ type: UpdateTemplatePromptConfigDto })
  @ApiOkResponse({ description: "Prompt configuration saved successfully" })
  async savePromptConfig(
    @Param("templateId") templateId: string,
    @Body() dto: UpdateTemplatePromptConfigDto,
  ) {
    const config = await this.templatePromptService.savePromptConfig(
      templateId,
      dto,
    );
    return { success: true, data: config, error: null, meta: null };
  }
}
