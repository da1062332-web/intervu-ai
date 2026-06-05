import { Controller, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ValidateResponse } from '@intervu/shared';
import { z } from 'zod';
import { ExecutionService } from '../services/execution.service';

@ApiTags('execution')
@ApiBearerAuth('jwt-auth')
@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post(':testId/start')
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: 'Start a test execution' })
  async startTest(@Param('testId') testId: string) {
    return this.executionService.startTest(testId);
  }

  @Post(':testId/questions/:questionId/submit')
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: 'Submit an answer for a question' })
  async submitAnswer(
    @Param('testId') testId: string,
    @Param('questionId') questionId: string,
    @Body() body: unknown
  ) {
    return this.executionService.submitAnswer(testId, questionId, body);
  }

  @Post(':testId/finish')
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: 'Finish a test execution' })
  async finishTest(@Param('testId') testId: string) {
    return this.executionService.finishTest(testId);
  }
}
