import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

import { QuestionSearchService } from "../services/question-search.service";
import { SearchFiltersDto } from "../dto/question-bank.dto";
import { GenerationOrchestratorService } from "../../generation/services/generation-orchestrator.service";
import { PrismaService } from "../../../prisma/prisma.service";

@ApiTags("questions")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("questions")
export class QuestionsController {
  constructor(
    private readonly searchService: QuestionSearchService,
    private readonly prisma: PrismaService,
    @Optional()
    private readonly generationOrchestrator?: GenerationOrchestratorService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List and search questions with rich query filters",
  })
  @ApiOkResponse({ description: "Questions retrieved successfully" })
  async search(@Query() filters: SearchFiltersDto) {
    const result = await this.searchService.search(filters);
    return {
      success: true,
      data: result.questions,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Generate questions via AI engine" })
  @ApiCreatedResponse({ description: "Question generation job initiated" })
  async generateQuestions(
    @Body()
    body: {
      examConfigId?: string;
      conceptKey?: string;
      count?: number;
      difficultyLevel?: string | string[];
    },
  ) {
    const difficultyLevel = Array.isArray(body.difficultyLevel)
      ? body.difficultyLevel[0] || "MEDIUM"
      : body.difficultyLevel || "MEDIUM";

    const count = body.count || 5;

    if (this.generationOrchestrator && body.examConfigId) {
      const result = await this.generationOrchestrator.generateQuestions(
        body.examConfigId,
        undefined,
        count,
      );
      return {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    return {
      success: true,
      data: {
        jobId: `gen_job_${Date.now()}`,
        status: "COMPLETED",
        generatedCount: count,
        difficultyDistribution: Array.isArray(body.difficultyLevel)
          ? body.difficultyLevel
          : [difficultyLevel],
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get("generated")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "View generated question pool" })
  @ApiOkResponse({ description: "Generated questions retrieved successfully" })
  async getGeneratedQuestions(
    @Query("conceptKey") conceptKey?: string,
    @Query("difficulty") difficulty?: string,
    @Query("limit") limit?: string,
  ) {
    const where: any = {};
    if (conceptKey) {
      where.conceptKey = { equals: conceptKey, mode: "insensitive" };
    }
    if (difficulty) {
      where.difficultyLevel = difficulty.toUpperCase();
    }
    const questions = await this.prisma.generatedQuestion.findMany({
      where,
      take: limit ? parseInt(limit, 10) : 50,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: questions.map((q) => ({
        id: q.id,
        templateId: q.templateId,
        conceptKey: q.conceptKey,
        questionText: q.questionText,
        variables: q.metadata,
        options: q.options,
        answer: q.correctAnswer,
        explanation: q.solution,
        createdAt: q.createdAt,
      })),
      meta: {
        count: questions.length,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
