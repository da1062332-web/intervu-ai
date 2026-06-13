import { z } from "zod";
import {
  ResultResponseSchema,
  RecommendationResponseSchema,
  PerformanceSummaryResponseSchema,
  HistoryItemResponseSchema,
  HistoryResponseSchema,
  SkillScoreSchema,
} from "../schemas/results.schema";
import { PaginationDto } from "./common.dto";

export type SkillScoreDto = z.infer<typeof SkillScoreSchema>;
export type ResultResponseDto = z.infer<typeof ResultResponseSchema>;
export type RecommendationResponseDto = z.infer<typeof RecommendationResponseSchema>;
export type PerformanceSummaryResponseDto = z.infer<typeof PerformanceSummaryResponseSchema>;
export type HistoryItemResponseDto = z.infer<typeof HistoryItemResponseSchema>;
export type HistoryResponseDto = z.infer<typeof HistoryResponseSchema>;

export class HistoryPaginationDto extends PaginationDto {}
