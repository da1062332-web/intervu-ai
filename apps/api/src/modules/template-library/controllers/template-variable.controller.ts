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

import {
  CreateTemplateVariableDto,
  UpdateTemplateVariableDto,
} from "@intervu/shared";
import {
  ValidateResponse,
  TemplateVariableSchema,
  TemplateVariableListSchema,
} from "@intervu/shared";
import { TemplateService } from "../services/template.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("template-variables")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller()
export class TemplateVariableController {
  constructor(private readonly templateService: TemplateService) {}

  @Get("templates/:templateId/variables")
  @ValidateResponse(TemplateVariableListSchema)
  @ApiOperation({ summary: "Get all variables for a template" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiOkResponse({ description: "List of template variables" })
  async getVariables(@Param("templateId") templateId: string) {
    return this.templateService.getVariables(templateId);
  }

  @Post("templates/:templateId/variables")
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(TemplateVariableSchema)
  @ApiOperation({ summary: "Create a new template variable" })
  @ApiParam({ name: "templateId", description: "Template CUID/UUID" })
  @ApiBody({ type: CreateTemplateVariableDto })
  @ApiCreatedResponse({ description: "Template variable created successfully" })
  async createVariable(
    @Param("templateId") templateId: string,
    @Body() dto: CreateTemplateVariableDto,
  ) {
    return this.templateService.createVariable(templateId, dto);
  }

  @Patch("variables/:id")
  @ValidateResponse(TemplateVariableSchema)
  @ApiOperation({ summary: "Update an existing template variable" })
  @ApiParam({ name: "id", description: "Variable UUID" })
  @ApiBody({ type: UpdateTemplateVariableDto })
  @ApiOkResponse({ description: "Template variable updated successfully" })
  async updateVariable(
    @Param("id") id: string,
    @Body() dto: UpdateTemplateVariableDto,
  ) {
    return this.templateService.updateVariable(id, dto);
  }

  @Delete("variables/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a template variable" })
  @ApiParam({ name: "id", description: "Variable UUID" })
  @ApiOkResponse({ description: "Template variable deleted successfully" })
  async deleteVariable(@Param("id") id: string) {
    return this.templateService.deleteVariable(id);
  }
}
