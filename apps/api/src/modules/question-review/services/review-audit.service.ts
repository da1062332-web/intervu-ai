import { Injectable } from "@nestjs/common";
import { ReviewAuditLogRepository } from "../repositories/review-audit-log.repository";

@Injectable()
export class ReviewAuditService {
  constructor(private readonly auditLogRepo: ReviewAuditLogRepository) {}

  async logReview(params: {
    questionId: string;
    score: number;
    issues: string[];
    recommendation: string;
  }) {
    return this.auditLogRepo.create({
      questionId: params.questionId,
      score: params.score,
      issues: params.issues,
      recommendation: params.recommendation,
    });
  }

  async getAuditHistory(questionId: string) {
    return this.auditLogRepo.findByQuestionId(questionId);
  }
}
