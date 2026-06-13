import { Injectable } from "@nestjs/common";
import { PerformanceRepository } from "../repositories/performance.repository";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { PerformanceMapper } from "../mappers/performance.mapper";
import { HistoryMapper } from "../mappers/history.mapper";
import { PaginationDto, PerformanceSummaryResponseDto, HistoryResponseDto } from "@intervu/shared";

@Injectable()
export class PerformanceService {
  constructor(
    private readonly performanceRepository: PerformanceRepository,
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  async getPerformanceSummary(userId: string): Promise<PerformanceSummaryResponseDto> {
    const aggregate = await this.performanceRepository.getAggregatedPerformance(userId);
    return PerformanceMapper.toDto(aggregate);
  }

  async getHistory(userId: string, paginationDto: PaginationDto): Promise<HistoryResponseDto> {
    const result = await this.evaluationRepository.findByUserIdPaginated(userId, paginationDto);
    
    const items = HistoryMapper.toDtoList(result.items);
    const totalPages = Math.ceil(result.total / result.limit);

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages,
      hasNext: result.page < totalPages,
      hasPrevious: result.page > 1,
    };
  }
}
