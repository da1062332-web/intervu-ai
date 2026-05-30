import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

import { HealthService, HealthResponse } from '../services/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the health status of the API service and its dependencies',
  })
  @ApiOkResponse({
    description: 'Service is healthy',
    type: Object,
    example: {
      success: true,
      data: {
        status: 'ok',
        service: 'intervu-api',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        uptime: 123.45,
        dependencies: {
          redis: {
            status: 'healthy',
            responseTime: 5,
          },
        },
      },
    },
  })
  async checkHealth(): Promise<HealthResponse> {
    return this.healthService.getHealth();
  }
}

