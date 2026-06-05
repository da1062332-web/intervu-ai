import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class ExecutionService {
  finishTest(testId: string) {
    throw new Error('Method not implemented.');
  }
  async startTest(_testId: string) {
    void _testId;
    throw new NotImplementedException('Execution module not implemented yet');
  }

  async submitAnswer(_testId: string, _questionId: string, _answer: unknown) {
    void _testId; void _questionId; void _answer;
    throw new NotImplementedException('Execution module not implemented yet');
  }

  async endTest(_testId: string) {
    void _testId;
    throw new NotImplementedException('Execution module not implemented yet');
  }
}
