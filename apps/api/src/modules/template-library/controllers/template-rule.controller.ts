import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { CreateTemplateRuleDto, UpdateTemplateRuleDto } from "@intervu/shared";
import {
  ValidateResponse,
  TemplateRuleSchema,
  TemplateRuleListSchema,
} from "@intervu/shared";
import { TemplateService } from "../services/template.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("template-rules")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller()
export class TemplateRuleController {
  constructor(private readonly templateService: TemplateService) {}

  @Get("templates/:templateId/rules")
  @ValidateResponse(TemplateRuleListSchema)
  @ApiOperation({ summary: "Get all rules for a template" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiOkResponse({ description: "List of template rules" })
  async getRules(@Param("templateId") templateId: string) {
    return this.templateService.getRules(templateId);
  }

  @Post("templates/:templateId/rules")
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(TemplateRuleSchema)
  @ApiOperation({ summary: "Create a new template rule" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiBody({ type: CreateTemplateRuleDto })
  @ApiCreatedResponse({ description: "Template rule created successfully" })
  async createRule(
    @Param("templateId") templateId: string,
    @Body() dto: CreateTemplateRuleDto,
  ) {
    return this.templateService.createRule(templateId, dto);
  }

  @Patch("rules/:id")
  @ValidateResponse(TemplateRuleSchema)
  @ApiOperation({ summary: "Update an existing template rule" })
  @ApiParam({ name: "id", description: "Rule UUID" })
  @ApiBody({ type: UpdateTemplateRuleDto })
  @ApiOkResponse({ description: "Template rule updated successfully" })
  async updateRule(
    @Param("id") id: string,
    @Body() dto: UpdateTemplateRuleDto,
  ) {
    return this.templateService.updateRule(id, dto);
  }

  @Delete("rules/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a template rule" })
  @ApiParam({ name: "id", description: "Rule UUID" })
  @ApiOkResponse({ description: "Template rule deleted successfully" })
  async deleteRule(@Param("id") id: string) {
    return this.templateService.deleteRule(id);
  }
}
