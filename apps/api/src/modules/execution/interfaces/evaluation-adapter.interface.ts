import { ExecutionResultDto } from "../dto/execution-result.dto";

export interface EvaluationAdapter {
  triggerEvaluation(executionResult: ExecutionResultDto): Promise<void>;
}

export const EVALUATION_ADAPTER = Symbol("EVALUATION_ADAPTER");
