import { GenerateQuestionRequest, AiQuestionResponse } from '../../types';

export interface IAiContract {
  generateQuestions(request: GenerateQuestionRequest): Promise<AiQuestionResponse>;
}
