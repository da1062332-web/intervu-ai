import { ExecutionStateRepository, ExecutionState } from "@intervu-ai/database";

export class ExecutionStateService {
  constructor(private readonly executionStateRepo: ExecutionStateRepository) {}

  /**
   * Saves the current execution heartbeat (timer and question index)
   */
  async saveProgress(
    testInstanceId: string,
    currentQuestionIndex: number,
    remainingTimeSeconds: number
  ): Promise<ExecutionState> {
    return await this.executionStateRepo.saveState({
      testInstanceId,
      currentQuestionIndex,
      remainingTimeSeconds,
    });
  }

  /**
   * Retrieves the latest state for resume functionality
   */
  async restoreProgress(testInstanceId: string): Promise<ExecutionState | null> {
    return await this.executionStateRepo.findByInstance(testInstanceId);
  }
}
