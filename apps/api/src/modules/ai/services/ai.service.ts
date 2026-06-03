import { Injectable, Logger } from '@nestjs/common';
import { 
  GenerateQuestionRequest, 
  AiQuestionResponseSchema, 
  AiQuestionResponse 
} from '@intervu/shared';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async generateQuestions(request: GenerateQuestionRequest): Promise<AiQuestionResponse> {
    // 1. Mock sending prompt to OpenAI / Claude
    const rawAiResponse = await this.mockAiCall(request);

    // 2. Validate AI output using the contract schema
    const validationResult = AiQuestionResponseSchema.safeParse(rawAiResponse);
    
    if (!validationResult.success) {
      this.logger.error('AI Runtime returned invalid payload shape', validationResult.error);
      throw new Error('AI Provider returned malformed response');
    }

    return validationResult.data;
  }

  private async mockAiCall(request: GenerateQuestionRequest): Promise<unknown> {
    // Simulating raw unstructured JSON from AI Provider
    return {
      questions: [
        {
          text: `Sample ${request.topic} question`,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A'
        }
      ]
    };
  }
}
