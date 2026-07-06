import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { QuestionRepository } from "../../question-bank/repositories/question.repository";
import { ReviewQueryDto } from "../dto/question-review.dto";

@ApiTags("reviews")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly questionRepo: QuestionRepository) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get review queue with search, priority, and reviewer filters",
  })
  @ApiOkResponse({ description: "Reviews queue retrieved successfully" })
  async getReviews(
    @Query()
    query: ReviewQueryDto & {
      reviewerId?: string;
      priority?: string;
      search?: string;
    },
  ) {
    const page =
      typeof query.page === "string"
        ? parseInt(query.page, 10)
        : Number(query.page) || 1;
    const limit =
      typeof query.limit === "string"
        ? parseInt(query.limit, 10)
        : Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = query.status
      ? { status: query.status as QuestionStatus }
      : { status: { in: [QuestionStatus.DRAFT, QuestionStatus.VALIDATED] } };

    if (query.search) {
      whereClause.questionText = {
        contains: query.search,
        mode: "insensitive",
      };
    }

    const [questions, total] = await Promise.all([
      this.questionRepo.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.questionRepo.count(whereClause),
    ]);

    return {
      success: true,
      data: questions.map((q) => ({
        ...q,
        priority: query.priority || "MEDIUM",
        reviewerId: query.reviewerId || null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
