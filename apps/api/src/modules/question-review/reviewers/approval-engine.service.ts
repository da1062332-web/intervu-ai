import { Injectable } from "@nestjs/common";

export interface ApprovalRecommendation {
  recommendation: "APPROVE" | "REVIEW" | "REJECT";
  reason: string;
}

@Injectable()
export class ApprovalEngineService {
  recommend(
    score: number,
    criticalIssuesCount: number = 0,
  ): ApprovalRecommendation {
    if (criticalIssuesCount > 0) {
      return {
        recommendation: "REJECT",
        reason: `Rejected due to ${criticalIssuesCount} critical structural/topic issues.`,
      };
    }

    if (score > 85) {
      return {
        recommendation: "APPROVE",
        reason: `Approved with a high quality score of ${score}.`,
      };
    } else if (score >= 60) {
      return {
        recommendation: "REVIEW",
        reason: `Escalated for human review with a borderline score of ${score}.`,
      };
    } else {
      return {
        recommendation: "REJECT",
        reason: `Rejected with a low quality score of ${score}.`,
      };
    }
  }
}
