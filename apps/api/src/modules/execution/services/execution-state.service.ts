 
import { Injectable, NotFoundException } from "@nestjs/common";
import { ExecutionState } from "@prisma/client";
import { ExecutionStateRepository } from "../repositories";
import { Prisma } from "@prisma/client";

@Injectable()
export class ExecutionStateService {
  constructor(private readonly executionStateRepo: ExecutionStateRepository) {}

  async saveProgress(
    testInstanceId: string,
    currentQuestionIndex: number,
    remainingTimeSeconds: number,
    tx?: Prisma.TransactionClient,
  ): Promise<ExecutionState> {
    const repo = tx
      ? this.executionStateRepo.withTransaction(tx)
      : this.executionStateRepo;

    const existingStates = await repo.findAll({ testInstanceId });
    const existing = existingStates[0];

    if (existing) {
      return repo.update(existing.id, {
        currentQuestionIndex,
        remainingTimeSeconds,
        lastActivityAt: new Date(),
      });
    }

    return repo.create({
      testInstance: { connect: { id: testInstanceId } },
      currentQuestionIndex,
      remainingTimeSeconds,
      lastActivityAt: new Date(),
    });
  }

  async restoreProgress(
    testInstanceId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ExecutionState | null> {
    const repo = tx
      ? this.executionStateRepo.withTransaction(tx)
      : this.executionStateRepo;
    const existingStates = await repo.findAll({ testInstanceId });
    return existingStates[0] || null;
  }
}
