import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class EvaluationService {
  async evaluateAnswer(answerId: string) {
    throw new NotImplementedException('Evaluation module not implemented yet');
  }

  async getEvaluation(answerId: string) {
    throw new NotImplementedException('Evaluation module not implemented yet');
  }
}
