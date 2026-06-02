import { GenerateQuestionRequestSchema, AiQuestionResponseSchema } from '../../schemas/ai.schema';
import { Difficulty } from '../../enums/difficulty.enum';

describe('AI Validation Flow', () => {
  it('should validate AI request and response', () => {
    const request = { topic: 'math', difficulty: Difficulty.EASY, count: 5 };
    expect(GenerateQuestionRequestSchema.safeParse(request).success).toBe(true);

    const response = {
      questions: [
        { text: '1+1', options: ['1', '2', '3'], correctAnswer: '2' }
      ]
    };
    expect(AiQuestionResponseSchema.safeParse(response).success).toBe(true);
  });
});
