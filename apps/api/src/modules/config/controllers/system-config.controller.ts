import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SystemConfigService } from "../services/system-config.service";
 
import { SystemConfigDto } from "../dto/system-config.dto";
 
import { UpdateSystemConfigDto } from "../dto/update-system-config.dto";
import { Template, UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import {
  ValidateResponse,
  SystemConfigSchema,
  TemplateListSchema,
} from "@intervu/shared";

@ApiTags("config")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("config")
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get("system")
  @ValidateResponse(SystemConfigSchema)
  @ApiOperation({
    summary: "Get Centralized System Configurations",
    description:
      "Returns configurations for difficulty, generation, validation, queues, and environment flags.",
  })
  @ApiOkResponse({ type: SystemConfigDto })
  async getSystemConfig(): Promise<SystemConfigDto> {
    return this.configService.getSystemConfig();
  }

  @Patch("system")
  @ValidateResponse(SystemConfigSchema)
  @ApiOperation({
    summary: "Update Centralized System Configurations",
    description:
      "Applies partial runtime configuration overrides and flushes the Redis cache.",
  })
  @ApiBody({ type: UpdateSystemConfigDto })
  @ApiOkResponse({ type: SystemConfigDto })
  async updateSystemConfig(
    @Body() dto: UpdateSystemConfigDto,
  ): Promise<SystemConfigDto> {
    return this.configService.updateSystemConfig(dto);
  }

  @Get("templates")
  @ValidateResponse(TemplateListSchema)
  @ApiOperation({
    summary: "Get System Question Templates",
    description:
      "Retrieves all available system templates configured within the platform.",
  })
  @ApiOkResponse({ description: "List of system templates" })
  async getTemplates(): Promise<Template[]> {
    return this.configService.getTemplates();
  }
}
