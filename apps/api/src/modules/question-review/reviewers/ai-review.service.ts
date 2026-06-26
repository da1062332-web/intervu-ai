import { Injectable, NotFoundException } from "@nestjs/common";
import { QuestionRepository } from "../../question-bank/repositories/question.repository";
import { QuestionVersionRepository } from "../../question-bank/repositories/question-version.repository";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { StructureAnalyzerService } from "../analyzers/structure-analyzer.service";
import { DifficultyAnalyzerService } from "../analyzers/difficulty-analyzer.service";
import { TopicAnalyzerService } from "../analyzers/topic-analyzer.service";
import { QuestionAnalyticsService } from "../analyzers/question-analytics.service";
import { ApprovalEngineService } from "./approval-engine.service";
import { QuestionEnrichmentService } from "../enrichers/question-enrichment.service";
import { ReviewAuditService } from "../services/review-audit.service";
import { GenerationMonitorService } from "../monitoring/generation-monitor.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionStatus } from "@prisma/client";

export interface QuestionReviewResult {
  score: number;
  recommendation: string;
  issues: string[];
}

@Injectable()
export class AIReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionRepo: QuestionRepository,
    private readonly versionRepo: QuestionVersionRepository,
    private readonly topicRepo: TopicRepository,
    private readonly structureAnalyzer: StructureAnalyzerService,
    private readonly difficultyAnalyzer: DifficultyAnalyzerService,
    private readonly topicAnalyzer: TopicAnalyzerService,
    private readonly questionAnalytics: QuestionAnalyticsService,
    private readonly approvalEngine: ApprovalEngineService,
    private readonly questionEnrichment: QuestionEnrichmentService,
    private readonly reviewAuditService: ReviewAuditService,
    private readonly generationMonitor: GenerationMonitorService,
  ) {}

  async reviewQuestion(questionId: string): Promise<QuestionReviewResult> {
    // 1. Fetch Question
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // 2. Fetch Topic Name
    let topicName = "General";
    if (question.topicId) {
      const topic = await this.topicRepo.findById(question.topicId);
      if (topic) {
        topicName = topic.name;
      }
    }

    // 3. Retrieve Options from version snapshots
    let options: string[] = [];
    const versions = await this.versionRepo.findByQuestionId(questionId);
    if (versions.length > 0) {
      const snapshot = versions[0].snapshot as any;
      if (snapshot && Array.isArray(snapshot.options)) {
        options = snapshot.options;
      }
    }

    // 4. Run Analyzers
    const structRes = await this.structureAnalyzer.analyze({
      questionText: question.questionText,
      answer: question.answer,
      explanation: question.explanation,
      options,
    });

    const diffRes = await this.difficultyAnalyzer.analyze({
      requestedDifficulty: question.difficulty,
      generatedQuestion: {
        questionText: question.questionText,
        answer: question.answer,
        explanation: question.explanation,
        options,
      },
    });

    const topicRes = await this.topicAnalyzer.analyze({
      requestedTopic: topicName,
      questionText: question.questionText,
      explanation: question.explanation,
    });

    const analyticsRes = await this.questionAnalytics.analyze({
      questionText: question.questionText,
      answer: question.answer,
      explanation: question.explanation,
      options,
      topicName,
    });

    // 5. Composite Score Calculation (0-100)
    // Structure holds 50%, Topic match is critical, Readability & Coverage hold 50%
    let score = (structRes.score * 0.5) + (analyticsRes.readability * 0.2) + (analyticsRes.coverage * 0.3);
    
    const issues = [...structRes.issues];

    if (!topicRes.match) {
      score = Math.max(0, score - 30);
      issues.push(`Topic mismatch: requested "${topicRes.requested}", but question content resembles "${topicRes.actual}"`);
    }

    if (diffRes.expected !== diffRes.actual) {
      score = Math.max(0, score - 15);
      issues.push(`Difficulty mismatch: requested "${diffRes.expected}", but analyzed actual is "${diffRes.actual}"`);
    }

    if (analyticsRes.readability < 40) {
      issues.push(`Low readability score (${analyticsRes.readability}): text might be too complex or wordy`);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    // 6. Recommendation Engine
    const criticalIssuesCount = (!structRes.isValid || !topicRes.match) ? 1 : 0;
    const approval = this.approvalEngine.recommend(score, criticalIssuesCount);

    // 7. Write Audit Trail (stores logs)
    await this.reviewAuditService.logReview({
      questionId,
      score,
      issues,
      recommendation: approval.recommendation,
    });

    // 8. Record Dashboard Metrics
    await this.generationMonitor.recordReview({
      score,
      difficultyMatched: diffRes.expected === diffRes.actual,
      recommendation: approval.recommendation,
    });

    // 9. Update Database Entity States & Enrichment
    await this.prisma.$transaction(async (tx) => {
      let finalStatus: QuestionStatus = QuestionStatus.DRAFT;
      let finalMetadata: any = question.metadata || {};

      if (approval.recommendation === "APPROVE") {
        finalStatus = QuestionStatus.ACTIVE;
        
        // Enrich Metadata
        const enrichment = await this.questionEnrichment.enrich({
          questionText: question.questionText,
          answer: question.answer,
          explanation: question.explanation,
          difficulty: question.difficulty,
          difficultyConfidence: diffRes.confidence,
          topicName,
        });

        finalMetadata = {
          ...finalMetadata,
          ...enrichment,
        };
      } else if (approval.recommendation === "REVIEW") {
        finalStatus = QuestionStatus.VALIDATED;
      } else {
        finalStatus = QuestionStatus.DRAFT;
      }

      // Update question details
      const updated = await tx.question.update({
        where: { id: questionId },
        data: {
          status: finalStatus,
          metadata: finalMetadata,
          version: { increment: 1 },
        },
      });

      // Capture snapshot for version trail
      const snapshot: Record<string, any> = {
        id: updated.id,
        questionText: updated.questionText,
        answer: updated.answer,
        explanation: updated.explanation,
        topicId: updated.topicId,
        sectionId: updated.sectionId,
        difficulty: updated.difficulty,
        difficultyScore: updated.difficultyScore,
        source: updated.source,
        templateId: updated.templateId,
        status: updated.status,
        options,
        metadata: finalMetadata,
      };

      await tx.questionVersion.create({
        data: {
          questionId,
          version: updated.version,
          snapshot,
        },
      });
    });

    return {
      score,
      recommendation: approval.recommendation,
      issues,
    };
  }
}
