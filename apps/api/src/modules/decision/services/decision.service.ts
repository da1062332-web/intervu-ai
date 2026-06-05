import { Injectable, NotImplementedException } from "@nestjs/common";

@Injectable()
export class DecisionService {
  async makeDecision(_testId: string) {
    void _testId;
    throw new NotImplementedException("Decision module not implemented yet");
  }

  async getDecision(_testId: string) {
    void _testId;
    throw new NotImplementedException("Decision module not implemented yet");
  }
}
