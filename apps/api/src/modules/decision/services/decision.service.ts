import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class DecisionService {
  async makeDecision(testId: string) {
    throw new NotImplementedException('Decision module not implemented yet');
  }

  async getDecision(testId: string) {
    throw new NotImplementedException('Decision module not implemented yet');
  }
}
