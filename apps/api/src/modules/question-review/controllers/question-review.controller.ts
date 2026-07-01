import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, QuestionStatus } from "@prisma/client";
import { AIReviewService } from "../reviewers/ai-review.service";
import { GenerationMonitorService } from "../monitoring/generation-monitor.service";
import { ReviewAuditService } from "../services/review-audit.service";
import { QuestionRepository } from "../../question-bank/repositories/question.repository";
import { QuestionVersionRepository } from "../../question-bank/repositories/question-version.repository";

import {
  BulkReviewDto,
  ReviewQueryDto,
  QuestionReviewResultDto,
} from "../dto/question-review.dto";

@ApiTags("Question Review")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("review")
export class QuestionReviewController {
  constructor(
    private readonly aiReviewService: AIReviewService,
    private readonly monitorService: GenerationMonitorService,
    private readonly auditService: ReviewAuditService,
    private readonly questionRepo: QuestionRepository,
    private readonly versionRepo: QuestionVersionRepository,
  ) {}

  @Get("questions")
  @ApiOperation({ summary: "Get questions in the review queue" })
  async getQueue(@Query() query: ReviewQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    // Default queue filters out ACTIVE/ARCHIVED questions
    const whereClause = query.status
      ? { status: query.status as QuestionStatus }
      : { status: { in: [QuestionStatus.DRAFT, QuestionStatus.VALIDATED] } };

    const [questions, total] = await Promise.all([
      this.questionRepo.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.questionRepo.count(whereClause),
    ]);

    return {
      questions,
      total,
      page,
      limit,
    };
  }

  @Get("questions/:id")
  @ApiOperation({ summary: "Get question details with review logs" })
  async getDetail(@Param("id") id: string) {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const versions = await this.versionRepo.findByQuestionId(id);
    const auditLogs = await this.auditService.getAuditHistory(id);

    // Extract options from latest version snapshot if available
    let options: string[] = [];
    if (versions.length > 0) {
      const snapshot = versions[0].snapshot as Record<string, unknown>;
      if (snapshot && Array.isArray(snapshot.options)) {
        options = snapshot.options;
      }
    }

    return {
      ...question,
      options,
      versions,
      auditLogs,
    };
  }

  @Post("questions/:id/analyze")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Manually run AI review for a single question" })
  @ApiOkResponse({ type: QuestionReviewResultDto })
  async analyzeQuestion(@Param("id") id: string) {
    return this.aiReviewService.reviewQuestion(id);
  }

  @Post("bulk")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Run AI reviews for multiple questions in parallel",
  })
  async bulkReview(@Body() dto: BulkReviewDto) {
    const { questionIds } = dto;
    if (!questionIds || questionIds.length === 0) {
      return { results: {} };
    }

    // Run parallel reviews to achieve high performance
    const resultsArray = await Promise.all(
      questionIds.map(async (id) => {
        try {
          const result = await this.aiReviewService.reviewQuestion(id);
          return { id, success: true, ...result };
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return { id, success: false, error: message };
        }
      }),
    );

    const results = resultsArray.reduce(
      (acc, current) => {
        const { id, ...rest } = current;
        acc[id] = rest;
        return acc;
      },
      {} as Record<string, unknown>,
    );

    return { results };
  }

  @Get("metrics")
  @ApiOperation({ summary: "Get aggregate dashboard statistics" })
  async getMetrics() {
    return this.monitorService.getMetrics();
  }
}
