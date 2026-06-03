import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { 
  CreateTestRequestDto,
  GenerateQuestionRequestDto,
  EvaluationRequestDto,
  ApiSuccessResponse
} from '@intervu/shared';

@Controller('tests')
export class TestAssemblyController {
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTest(@Body() body: CreateTestRequestDto): Promise<ApiSuccessResponse> {
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
  async generateQuestions(@Body() body: GenerateQuestionRequestDto): Promise<ApiSuccessResponse> {
    return {
      success: true,
      data: {
        topic: body.topic,
        difficulty: body.difficulty,
        count: body.count,
        status: 'queued'
      }
    };
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateAnswer(@Body() body: EvaluationRequestDto): Promise<ApiSuccessResponse> {
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
