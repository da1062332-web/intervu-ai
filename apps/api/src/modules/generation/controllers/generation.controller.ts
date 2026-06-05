import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { GenerateQuestionRequestDto } from '@intervu/shared';
import { GenerationDataSchema } from '@intervu-ai/contracts';
import { ValidateResponse } from '@intervu/shared';
import { GenerationService } from '../services/generation.service';

@ApiTags('generation')
@ApiBearerAuth('jwt-auth')
@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post('enqueue')
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(GenerationDataSchema)
  @ApiOperation({ summary: 'Enqueue a question generation job' })
  @ApiBody({ type: GenerateQuestionRequestDto, description: 'Generation job parameters' })
  @ApiCreatedResponse({ description: 'Job enqueued — returns jobId and status' })
  async enqueue(@Body() dto: GenerateQuestionRequestDto) {
    return this.generationService.enqueueGeneration(dto);
  }

  @Get(':jobId/status')
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(GenerationDataSchema)
  @ApiOperation({ summary: 'Poll the status of a generation job' })
  @ApiParam({ name: 'jobId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'BullMQ job UUID' })
  @ApiOkResponse({ description: 'Job status and result if completed' })
  async getStatus(@Param('jobId') jobId: string) {
    return this.generationService.getGenerationStatus(jobId);
  }
}
