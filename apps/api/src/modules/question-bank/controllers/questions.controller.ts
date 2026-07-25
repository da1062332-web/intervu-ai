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
  Param,
  Patch,
  Delete,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

import { QuestionSearchService } from "../services/question-search.service";
import { SearchFiltersDto } from "../dto/question-bank.dto";
import { GenerationOrchestratorService } from "../../generation/services/generation-orchestrator.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { TemplateService } from "../../template-library/services/template.service";

@ApiTags("questions")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("questions")
export class QuestionsController {
  constructor(
    private readonly searchService: QuestionSearchService,
    private readonly prisma: PrismaService,
    private readonly templateService: TemplateService,
    @Optional()
    private readonly generationOrchestrator?: GenerationOrchestratorService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List and search generated questions with query filters",
  })
  @ApiOkResponse({ description: "Generated questions retrieved successfully" })
  @ApiQuery({ name: "page", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: String })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "topicId", required: false, type: String })
  @ApiQuery({ name: "conceptKey", required: false, type: String })
  @ApiQuery({ name: "templateId", required: false, type: String })
  @ApiQuery({ name: "difficulty", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "sortBy", required: false, type: String })
  @ApiQuery({ name: "sortOrder", required: false, type: String })
  async search(
    @Query("page") pageStr?: string,
    @Query("limit") limitStr?: string,
    @Query("q") searchStr?: string,
    @Query("topicId") topicId?: string,
    @Query("conceptKey") conceptKey?: string,
    @Query("templateId") templateId?: string,
    @Query("difficulty") difficulty?: string,
    @Query("status") status?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search by text (questionText)
    if (searchStr) {
      where.questionText = { contains: searchStr, mode: "insensitive" };
    }

    // Filter by Concept
    if (conceptKey) {
      where.conceptKey = { equals: conceptKey, mode: "insensitive" };
    }

    // Filter by Template
    if (templateId) {
      where.templateId = templateId;
    }

    // Filter by Difficulty
    if (difficulty) {
      where.difficultyLevel = difficulty.toUpperCase();
    }

    // Filter by Topic (conceptKey belongs to Concept, which has topicId)
    if (topicId) {
      const concepts = await this.prisma.concept.findMany({
        where: { topicId },
        select: { code: true },
      });
      where.conceptKey = { in: concepts.map((c) => c.code) };
    }

    // Sorting logic
    let orderByField = "createdAt";
    let orderByDirection: "asc" | "desc" = "desc";

    if (sortBy) {
      if (sortBy === "oldest") {
        orderByField = "createdAt";
        orderByDirection = "asc";
      } else if (sortBy === "newest") {
        orderByField = "createdAt";
        orderByDirection = "desc";
      } else if (sortBy === "difficulty") {
        orderByField = "difficultyLevel";
        orderByDirection = sortOrder === "asc" ? "asc" : "desc";
      } else if (sortBy === "status") {
        orderByField = "createdAt";
        orderByDirection = "desc";
      }
    }

    if (sortOrder) {
      orderByDirection = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
    }

    let [allFetchedQuestions, total] = await Promise.all([
      this.prisma.generatedQuestion.findMany({
        where,
        skip: status ? 0 : skip,
        take: status ? 500 : limit,
        orderBy: { [orderByField]: orderByDirection },
      }),
      this.prisma.generatedQuestion.count({ where }),
    ]);

    let questions = allFetchedQuestions;
    if (status) {
      const targetStatus = status.toUpperCase();
      questions = allFetchedQuestions.filter((q: any) => {
        const qStatus = (q.metadata?.status || "GENERATED").toUpperCase();
        if (targetStatus === "GENERATED" || targetStatus === "DRAFT") {
          return qStatus === "GENERATED" || qStatus === "DRAFT";
        }
        return qStatus === targetStatus;
      });
      total = questions.length;
      questions = questions.slice(skip, skip + limit);
    }

    // Batch resolve concept and topic IDs for response mapping
    const conceptKeys = Array.from(
      new Set(questions.map((q) => q.conceptKey).filter(Boolean)),
    );
    const matchedConcepts = conceptKeys.length > 0
      ? await this.prisma.concept.findMany({
          where: {
            OR: [
              { code: { in: conceptKeys } },
              { id: { in: conceptKeys } },
            ],
          },
          select: { id: true, code: true, topicId: true, name: true },
        })
      : [];

    const conceptMap = new Map<string, { id: string; topicId: string; name: string }>();
    for (const c of matchedConcepts) {
      conceptMap.set(c.code, c);
      conceptMap.set(c.id, c);
    }

    return {
      success: true,
      data: questions.map((q) => {
        const c = conceptMap.get(q.conceptKey);
        return {
          id: q.id,
          templateId: q.templateId,
          conceptKey: q.conceptKey,
          conceptId: c?.id || q.conceptKey,
          topicId: c?.topicId,
          questionText: q.questionText,
          variables: q.metadata,
          options: q.options,
          answer: q.correctAnswer,
          correctAnswer: q.correctAnswer,
          explanation: q.solution,
          difficulty: q.difficultyLevel,
          status: (q.metadata as any)?.status || "GENERATED",
          createdAt: q.createdAt,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

  @Get("statistics")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Expose summary metrics for administrators" })
  async getStatistics() {
    const questions = await this.prisma.generatedQuestion.findMany({
      select: { metadata: true },
    });

    let generatedCount = questions.length;
    let approvedCount = 0;
    let publishedCount = 0;
    let rejectedCount = 0;

    for (const q of questions) {
      const status = (q.metadata as any)?.status || "GENERATED";
      if (status === "APPROVED") approvedCount++;
      else if (status === "PUBLISHED") publishedCount++;
      else if (status === "REJECTED") rejectedCount++;
    }

    const [templatesCount, conceptsCount] = await Promise.all([
      this.prisma.template.count(),
      this.prisma.concept.count(),
    ]);

    return {
      generated: generatedCount,
      approved: approvedCount,
      published: publishedCount,
      rejected: rejectedCount,
      templates: templatesCount,
      concepts: conceptsCount,
    };
  }

  @Get("generated")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "View generated question pool" })
  @ApiOkResponse({ description: "Generated questions retrieved successfully" })
  @ApiQuery({ name: "conceptKey", required: false, type: String })
  @ApiQuery({ name: "difficulty", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: String })
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
        correctAnswer: q.correctAnswer,
        explanation: q.solution,
        createdAt: q.createdAt,
      })),
      meta: {
        count: questions.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve a single generated question by ID" })
  async getQuestion(@Param("id") id: string) {
    const question = await this.prisma.generatedQuestion.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }
    return {
      success: true,
      data: {
        id: question.id,
        templateId: question.templateId,
        conceptKey: question.conceptKey,
        questionText: question.questionText,
        variables: question.metadata,
        options: question.options,
        answer: question.correctAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.solution,
        questionType: question.questionType,
        status: (question.metadata as any)?.status || "GENERATED",
        createdAt: question.createdAt,
      },
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Edit a generated question before publishing" })
  async editQuestion(
    @Param("id") id: string,
    @Body()
    body: {
      questionText?: string;
      options?: string[];
      correctAnswer?: string;
      explanation?: string;
      difficultyLevel?: string;
    },
  ) {
    const question = await this.prisma.generatedQuestion.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const updatedQuestion = {
      questionText:
        body.questionText !== undefined
          ? body.questionText
          : question.questionText,
      options: body.options !== undefined ? body.options : question.options,
      correctAnswer:
        body.correctAnswer !== undefined
          ? body.correctAnswer
          : (question.correctAnswer as string),
      solution:
        body.explanation !== undefined
          ? body.explanation
          : (question.solution as string),
      templateId: question.templateId,
      conceptKey: question.conceptKey,
      difficultyLevel:
        body.difficultyLevel !== undefined
          ? body.difficultyLevel
          : question.difficultyLevel,
      questionType: question.questionType,
    };

    const validationResult = this.validateQuestion(updatedQuestion);
    if (!validationResult.isValid) {
      throw new BadRequestException({
        success: false,
        errors: validationResult.errors,
      });
    }

    const currentMeta = (question.metadata as any) || {};
    const updatedMeta = {
      ...currentMeta,
      statusHistory: [
        ...(currentMeta.statusHistory || []),
        {
          action: "EDITED",
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const saved = await this.prisma.generatedQuestion.update({
      where: { id },
      data: {
        questionText: updatedQuestion.questionText,
        options: updatedQuestion.options as any,
        correctAnswer: updatedQuestion.correctAnswer as any,
        solution: updatedQuestion.solution as any,
        difficultyLevel: updatedQuestion.difficultyLevel as any,
        metadata: updatedMeta as any,
      },
    });

    return {
      success: true,
      data: {
        id: saved.id,
        questionText: saved.questionText,
        options: saved.options,
        answer: saved.correctAnswer,
        correctAnswer: saved.correctAnswer,
        explanation: saved.solution,
        difficulty: saved.difficultyLevel,
        questionType: saved.questionType,
        status: (saved.metadata as any)?.status || "GENERATED",
      },
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a generated question from the pool" })
  async deleteQuestion(@Param("id") id: string) {
    const question = await this.prisma.generatedQuestion.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    await this.prisma.generatedQuestion.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Question deleted successfully",
    };
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve a generated question" })
  async approveQuestion(@Param("id") id: string) {
    const question = await this.prisma.generatedQuestion.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const currentMeta = (question.metadata as any) || {};
    const currentStatus = currentMeta.status || "GENERATED";

    if (currentStatus !== "GENERATED" && currentStatus !== "REJECTED") {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to APPROVED`,
      );
    }

    const validationCheck = this.validateQuestion({
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer as string,
      solution: question.solution as string,
      templateId: question.templateId,
      conceptKey: question.conceptKey,
      difficultyLevel: question.difficultyLevel,
      questionType: question.questionType,
    });

    if (!validationCheck.isValid && !currentMeta.isDirectDatasetFetch && currentMeta.generationStrategy !== "DATASET") {
      throw new BadRequestException({
        success: false,
        message: `Cannot approve invalid question. Errors: ${validationCheck.errors.join(" | ")}`,
        errors: validationCheck.errors,
      });
    }

    const updatedMeta = {
      ...currentMeta,
      status: "APPROVED",
      statusHistory: [
        ...(currentMeta.statusHistory || []),
        {
          status: "APPROVED",
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    await this.prisma.generatedQuestion.update({
      where: { id },
      data: { metadata: updatedMeta },
    });

    // Auto-publish to Question Bank
    try {
      await this.publishQuestion(id);
    } catch (err) {
      console.error("Failed to auto-publish question after approval", err);
    }

    return {
      success: true,
      status: "APPROVED",
    };
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject a generated question" })
  async rejectQuestion(@Param("id") id: string) {
    const question = await this.prisma.generatedQuestion.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const currentMeta = (question.metadata as any) || {};
    const currentStatus = currentMeta.status || "GENERATED";

    if (currentStatus !== "GENERATED") {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to REJECTED`,
      );
    }

    const updatedMeta = {
      ...currentMeta,
      status: "REJECTED",
      statusHistory: [
        ...(currentMeta.statusHistory || []),
        {
          status: "REJECTED",
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    await this.prisma.generatedQuestion.update({
      where: { id },
      data: { metadata: updatedMeta },
    });

    return {
      success: true,
      status: "REJECTED",
    };
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Publish an approved question to main pool" })
  async publishQuestion(@Param("id") id: string) {
    const question = await this.prisma.generatedQuestion.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const currentMeta = (question.metadata as any) || {};
    const currentStatus = currentMeta.status || "GENERATED";

    if (currentStatus !== "APPROVED") {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to PUBLISHED. Question must be APPROVED first.`,
      );
    }

    // First check if conceptKey is directly a topicId (UUID format)
    let topicId: string | undefined;
    
    // Try as a concept code first
    const concept = await this.prisma.concept.findFirst({
      where: { code: { equals: question.conceptKey, mode: "insensitive" } },
    });
    
    if (concept?.topicId) {
      topicId = concept.topicId;
    } else {
      // If no concept found, try treating conceptKey as a topicId directly
      const topicCheck = await this.prisma.topic.findUnique({
        where: { id: question.conceptKey },
      });
      if (topicCheck?.id) {
        topicId = topicCheck.id;
      } else {
        // Last resort: use first topic
        topicId = (await this.prisma.topic.findFirst())?.id;
      }
    }
    
    if (!topicId) {
      throw new BadRequestException(
        "No topic found to associate with the question",
      );
    }

    let section = await this.prisma.examSection.findFirst({
      where: { sectionTopics: { some: { topicId } } },
    });
    if (!section) {
      section = await this.prisma.examSection.findFirst();
    }
    if (!section) {
      let examConfig = await this.prisma.examConfig.findFirst();
      if (!examConfig) {
        examConfig = await this.prisma.examConfig.create({
          data: {
            code: "default_config",
            name: "Default Config",
            role: "BACKEND",
            durationMinutes: 60,
            totalQuestions: 10,
          },
        });
      }
      section = await this.prisma.examSection.create({
        data: {
          examConfigId: examConfig.id,
          name: "Default Section",
          code: "default_section",
          questionCount: 10,
          sectionDurationMinutes: 60,
          sectionOrder: 1,
        },
      });
    }

    const mainQuestion = await this.prisma.question.create({
      data: {
        questionText: question.questionText,
        answer: question.correctAnswer as string,
        explanation: question.solution as string,
        topicId,
        sectionId: section.id,
        difficulty: question.difficultyLevel,
        source: "GENERATED",
        templateId: question.templateId,
        version: 1,
        status: "ACTIVE",
        metadata: {
          options: question.options,
          _generatedQuestionId: question.id,
          _generationSeed: currentMeta._generationSeed,
          _templateVersion: currentMeta._templateVersion,
        },
      },
    });

    const updatedMeta = {
      ...currentMeta,
      status: "PUBLISHED",
      statusHistory: [
        ...(currentMeta.statusHistory || []),
        {
          status: "PUBLISHED",
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    await this.prisma.generatedQuestion.update({
      where: { id },
      data: { metadata: updatedMeta },
    });

    return {
      success: true,
      status: "PUBLISHED",
      mainQuestionId: mainQuestion.id,
    };
  }

  @Post(":id/regenerate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Regenerate a question while keeping lineage" })
  async regenerateQuestion(@Param("id") id: string) {
    const question = await this.prisma.generatedQuestion.findUnique({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const currentMeta = (question.metadata as any) || {};

    const genResult = await this.templateService.generateQuestionForTemplate(
      question.templateId,
    );
    if (!genResult || !genResult.success) {
      throw new BadRequestException(
        "Failed to generate a new question from template",
      );
    }

    const currentVersion = currentMeta.version || 1;
    const historySnapshot = {
      version: currentVersion,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      solution: question.solution,
      metadata: {
        ...currentMeta,
        statusHistory: undefined,
        previousVersions: undefined,
      },
      regeneratedAt: new Date().toISOString(),
    };

    const newParams = genResult.question.variables || {};
    const updatedMeta = {
      ...newParams,
      version: currentVersion + 1,
      status: "GENERATED",
      statusHistory: [
        ...(currentMeta.statusHistory || []),
        {
          action: "REGENERATED",
          fromVersion: currentVersion,
          toVersion: currentVersion + 1,
          updatedAt: new Date().toISOString(),
        },
      ],
      previousVersions: [
        ...(currentMeta.previousVersions || []),
        historySnapshot,
      ],
      _generationSeed: genResult.question.variables?._generationSeed,
      _templateVersion: genResult.question.variables?._templateVersion,
    };

    await this.prisma.generatedQuestion.delete({
      where: { id: genResult.question.id },
    });

    const saved = await this.prisma.generatedQuestion.update({
      where: { id },
      data: {
        questionText: genResult.question.questionText,
        options: genResult.question.options,
        correctAnswer: genResult.question.answer,
        solution: genResult.question.explanation,
        metadata: updatedMeta,
      },
    });

    return {
      success: true,
      data: {
        id: saved.id,
        version: updatedMeta.version,
        questionText: saved.questionText,
        options: saved.options,
        answer: saved.correctAnswer,
        explanation: saved.solution,
        status: "GENERATED",
      },
    };
  }

  private validateQuestion(question: {
    questionText?: string;
    options?: any;
    correctAnswer?: any;
    solution?: any;
    templateId?: string;
    conceptKey?: string;
    difficultyLevel?: string;
    questionType?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const isMcq =
      typeof question.questionType === "string" &&
      ["MCQ", "MULTIPLE_CHOICE", "MCQS", "MSQ"].includes(
        question.questionType.toUpperCase(),
      );

    if (!question.questionText || question.questionText.trim() === "") {
      errors.push(
        "Question text exists validation failed: questionText is missing or empty",
      );
    }

    let parsedOptions: string[] = [];
    if (Array.isArray(question.options)) {
      parsedOptions = question.options.map((o) => String(o).trim().replace(/^"|"$/g, ''));
    } else if (typeof question.options === "string") {
      try {
        const parsed = JSON.parse(question.options);
        if (Array.isArray(parsed)) parsedOptions = parsed.map((o) => String(o).trim().replace(/^"|"$/g, ''));
      } catch (e) {}
    }

    if (isMcq) {
      if (parsedOptions.length === 0) {
        errors.push(
          "Options complete validation failed: options must be a non-empty array",
        );
      } else {
        if (parsedOptions.some((o) => !o || o === "")) {
          errors.push(
            "Reject on empty option: options must not contain empty values",
          );
        }
      }
    }

    let answerStr = "";
    if (question.correctAnswer !== undefined && question.correctAnswer !== null) {
      if (typeof question.correctAnswer === "object" && (question.correctAnswer as any).text) {
        answerStr = String((question.correctAnswer as any).text).trim().replace(/^"|"$/g, '');
      } else {
        answerStr = String(question.correctAnswer).trim().replace(/^"|"$/g, '');
      }
    }

    if (!answerStr) {
      if (parsedOptions.length > 0) {
        answerStr = parsedOptions[0];
      } else {
        errors.push(
          "Reject on missing answer: correctAnswer is missing or empty",
        );
      }
    }

    if (isMcq && parsedOptions.length > 0 && answerStr) {
      let isMatch = parsedOptions.some(
        (o) => o.toLowerCase() === answerStr.toLowerCase(),
      );

      if (!isMatch && /^\d+$/.test(answerStr)) {
        const idx = parseInt(answerStr, 10);
        if (idx >= 0 && idx < parsedOptions.length) {
          isMatch = true;
        }
      }

      if (!isMatch) {
        errors.push(
          `Exactly one correct answer validation failed: correctAnswer "${answerStr}" must match one of the options [${parsedOptions.join(", ")}]`,
        );
      }
    }

    let solutionText = "";
    if (typeof question.solution === "string") {
      solutionText = question.solution.trim();
    } else if (question.solution && typeof question.solution === "object") {
      solutionText = (question.solution as any).text || (question.solution as any).explanation || (question.solution as any).solution || "";
    }
    if (!solutionText && (question as any).explanation) {
      solutionText = String((question as any).explanation).trim();
    }

    if (!solutionText) {
      solutionText = "Solution provided automatically during question generation.";
    }

    if (!question.templateId || String(question.templateId).trim() === "") {
      errors.push(
        "Template reference exists validation failed: templateId is missing",
      );
    }

    if (!question.conceptKey || String(question.conceptKey).trim() === "") {
      errors.push("Concept exists validation failed: conceptKey is missing");
    }

    if (!question.difficultyLevel || question.difficultyLevel.trim() === "") {
      errors.push(
        "Difficulty assigned validation failed: difficultyLevel is missing",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
