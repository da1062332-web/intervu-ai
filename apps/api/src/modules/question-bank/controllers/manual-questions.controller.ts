import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
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
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

import { QuestionSearchService } from "../services/question-search.service";
import { QuestionBankService } from "../services/question-bank.service";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  SearchFiltersDto,
} from "../dto/question-bank.dto";

@ApiTags("manual-questions")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("manual-questions")
export class ManualQuestionsController {
  constructor(
    private readonly searchService: QuestionSearchService,
    private readonly prisma: PrismaService,
    private readonly bankService: QuestionBankService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a single manual question" })
  @ApiCreatedResponse({ description: "Question created successfully" })
  async createManualQuestion(@Body() dto: CreateQuestionDto) {
    const result = await this.bankService.createQuestion(dto);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List and search manual questions" })
  @ApiOkResponse({ description: "Manual questions retrieved successfully" })
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

  @Get("random")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get random questions for a concept and difficulty",
  })
  @ApiOkResponse({ description: "Random questions retrieved successfully" })
  async getRandom(
    @Query("conceptId") conceptId: string,
    @Query("difficulty") difficulty: string,
    @Query("count") countStr: string,
    @Query("excludeIds") excludeIdsStr?: string,
  ) {
    if (!conceptId) {
      throw new BadRequestException("conceptId is required");
    }
    const count = countStr ? parseInt(countStr, 10) : 1;
    const excludeIds = excludeIdsStr ? excludeIdsStr.split(",") : [];

    const questions = await this.bankService.getRandomQuestions({
      conceptId,
      difficulty,
      count,
      excludeIds,
    });

    return {
      success: true,
      data: questions,
    };
  }

  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search manual question pool" })
  @ApiOkResponse({ description: "Questions searched successfully" })
  async searchManualQuestions(@Query() filters: SearchFiltersDto) {
    const result = await this.searchService.search(filters);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve a single manual question by ID" })
  async getQuestion(@Param("id") id: string) {
    const manualQuestion = await this.prisma.question.findUnique({
      where: { id },
      include: { concept: true, topic: true, section: true },
    });

    if (!manualQuestion) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    return {
      success: true,
      data: manualQuestion,
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Edit a manual question by ID" })
  async editQuestion(@Param("id") id: string, @Body() body: UpdateQuestionDto) {
    const manualQuestion = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!manualQuestion) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const updated = await this.bankService.updateQuestion(id, body);
    return {
      success: true,
      data: updated,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive a manual question by ID" })
  async deleteQuestion(@Param("id") id: string) {
    const manualQuestion = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!manualQuestion) {
      throw new NotFoundException(`Question ${id} not found`);
    }

    const result = await this.bankService.archiveQuestion(id);
    return {
      success: true,
      message: "Question archived successfully",
      data: result,
    };
  }
}
