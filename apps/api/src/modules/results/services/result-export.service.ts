import { Injectable, NotFoundException } from "@nestjs/common";
import { ResultQueryService } from "./result-query.service";

@Injectable()
export class ResultExportService {
  constructor(private readonly resultQueryService: ResultQueryService) {}

  async exportToPdf(attemptId: string) {
    // PDF generation strategy placeholder
    // In next sprint, we will map ResultDetailDto to a PDF template

    const result = await this.resultQueryService.getResult(attemptId);
    if (!result) {
      throw new NotFoundException(`Result not found for attempt ${attemptId}`);
    }

    return {
      status: "pending_implementation",
      message:
        "PDF Export architecture is ready. Generation logic will be implemented in the next sprint.",
      dataContext: result,
    };
  }

  async exportToJson(attemptId: string) {
    const result = await this.resultQueryService.getResult(attemptId);
    if (!result) {
      throw new NotFoundException(`Result not found for attempt ${attemptId}`);
    }

    const analytics = await this.resultQueryService
      .getAnalytics(attemptId)
      .catch(() => null);
    const analysis = await this.resultQueryService
      .getAnalysis(attemptId)
      .catch(() => null);
    const recommendations = await this.resultQueryService
      .getRecommendations(attemptId)
      .catch(() => null);

    return {
      exportDate: new Date(),
      result,
      analytics,
      analysis,
      recommendations,
    };
  }
}
