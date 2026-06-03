import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { SystemConfigService } from '../services/system-config.service';
// eslint-disable-next-line no-restricted-imports
import { SystemConfigDto } from '../dto/system-config.dto';
// eslint-disable-next-line no-restricted-imports
import { UpdateSystemConfigDto } from '../dto/update-system-config.dto';
import { Template } from '@prisma/client';

@ApiTags('config')
@Controller('config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('system')
  @ApiOperation({
    summary: 'Get Centralized System Configurations',
    description: 'Returns configurations for difficulty, generation, validation, queues, and environment flags.',
  })
  @ApiOkResponse({ type: SystemConfigDto })
  async getSystemConfig(): Promise<SystemConfigDto> {
    return this.configService.getSystemConfig();
  }

  @Patch('system')
  @ApiOperation({
    summary: 'Update Centralized System Configurations',
    description: 'Applies partial runtime configuration overrides and flushes the Redis cache.',
  })
  @ApiBody({ type: UpdateSystemConfigDto })
  @ApiOkResponse({ type: SystemConfigDto })
  async updateSystemConfig(
    @Body() dto: UpdateSystemConfigDto,
  ): Promise<SystemConfigDto> {
    return this.configService.updateSystemConfig(dto);
  }

  @Get('templates')
  @ApiOperation({
    summary: 'Get System Question Templates',
    description: 'Retrieves all available system templates configured within the platform.',
  })
  @ApiOkResponse({ description: 'List of system templates' })
  async getTemplates(): Promise<Template[]> {
    return this.configService.getTemplates();
  }
}
