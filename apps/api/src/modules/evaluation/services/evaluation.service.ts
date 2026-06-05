import { Injectable, NotImplementedException } from "@nestjs/common";

@Injectable()
export class EvaluationService {
  async evaluateAnswer(_answerId: string) {
    void _answerId;
    throw new NotImplementedException("Evaluation module not implemented yet");
  }

  async getEvaluation(_answerId: string) {
    void _answerId;
    throw new NotImplementedException("Evaluation module not implemented yet");
  }
}
