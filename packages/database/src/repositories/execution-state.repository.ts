import { PrismaClient, ExecutionState } from "@prisma/client";

export class ExecutionStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveState(data: {
    testInstanceId: string;
    currentQuestionIndex: number;
    remainingTimeSeconds: number;
  }): Promise<ExecutionState> {
    return await this.prisma.executionState.upsert({
      where: { testInstanceId: data.testInstanceId },
      update: {
        currentQuestionIndex: data.currentQuestionIndex,
        remainingTimeSeconds: data.remainingTimeSeconds,
        lastActivityAt: new Date(),
      },
      create: {
        testInstanceId: data.testInstanceId,
        currentQuestionIndex: data.currentQuestionIndex,
        remainingTimeSeconds: data.remainingTimeSeconds,
      },
    });
  }

  async findByInstance(testInstanceId: string): Promise<ExecutionState | null> {
    return await this.prisma.executionState.findUnique({
      where: { testInstanceId },
    });
  }
}
