import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { 
  CreateTestRequest,
  GenerationRequest,
  EvaluationRequest,
  ApiSuccessResponse
} from '@intervu-ai/contracts';

import { TestAssemblyService } from '../services/test-assembly.service';

@Controller('tests')
export class TestAssemblyController {
  constructor(private readonly testAssemblyService: TestAssemblyService) {}

  @Get(':id')
  async getTest(@Param('id') id: string): Promise<ApiSuccessResponse> {
    const test = await this.testAssemblyService.getTest(id);
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return {
      success: true,
      data: test
    };
  }
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTest(@Body() body: CreateTestRequest): Promise<ApiSuccessResponse> {
    // The ZodValidationPipe will automatically enforce that body is CreateTestRequestDto
    return {
      success: true,
      data: {
        testId: 'test_123',
        companyId: body.companyId,
        testType: body.testType
      }
    };
  }

  @Post('questions/generate')
  @HttpCode(HttpStatus.OK)
  async generateQuestions(@Body() body: GenerationRequest): Promise<ApiSuccessResponse> {
    const result = await this.testAssemblyService.generateQuestions(body);

    return {
      success: true,
      data: result
    };
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateAnswer(@Body() body: EvaluationRequest): Promise<ApiSuccessResponse> {
    return {
      success: true,
      data: {
        answerId: body.answerId,
        score: 85,
        feedback: 'Good answer.'
      }
    };
  }
}
