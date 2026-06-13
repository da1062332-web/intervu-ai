import { Injectable } from "@nestjs/common";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { ResultMapper } from "../mappers/result.mapper";
import {
  ResultNotFoundError,
  UnauthorizedResultAccessError,
} from "@intervu/shared";
import { ResultResponseDto } from "@intervu/shared";

@Injectable()
export class ResultsService {
  constructor(private readonly evaluationRepository: EvaluationRepository) {}

  async getEvaluation(evaluationId: string) {
    const evaluation =
      await this.evaluationRepository.findEvaluationWithDetails(evaluationId);
    if (!evaluation) {
      throw new ResultNotFoundError();
    }
    return evaluation;
  }

  async getResultDetails(
    userId: string,
    evaluationId: string,
  ): Promise<ResultResponseDto> {
    const evaluation = await this.getEvaluation(evaluationId);

    if (evaluation.userId !== userId) {
      throw new UnauthorizedResultAccessError();
    }

    return this.composeResultResponse(evaluation);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  getSkillBreakdown(evaluation: any) {
    return evaluation.skillScores || [];
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  composeResultResponse(evaluation: any): ResultResponseDto {
    return ResultMapper.toDto(evaluation);
  }
}
