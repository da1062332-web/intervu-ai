import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class ExecutionService {
  async startTest(testId: string) {
    throw new NotImplementedException('Execution module not implemented yet');
  }

  async submitAnswer(testId: string, questionId: string, answer: any) {
    throw new NotImplementedException('Execution module not implemented yet');
  }

  async finishTest(testId: string) {
    throw new NotImplementedException('Execution module not implemented yet');
  }
}
