import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, QuestionStatus } from "@prisma/client";
import { TopicExpansionService } from "../generators/topic-expansion.service";
import { GenerationJobService } from "../services/generation-job.service";
import {
  CreateGenerationJobDto,
  TopicExpandDto,
  GenerationDashboardDto,
} from "../dto/generation-job.dto";
import { PrismaService } from "../../../prisma/prisma.service";

@ApiTags("generation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("generation")
export class GenerationAiController {
  constructor(
    private readonly topicExpansionService: TopicExpansionService,
    private readonly jobService: GenerationJobService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("topic-expand")
  @ApiOperation({ summary: "Automatically expand a topic into subtopics" })
  @ApiCreatedResponse({ description: "Topic expanded successfully" })
  async expandTopic(@Body() dto: TopicExpandDto) {
    const subtopics = await this.topicExpansionService.expandTopic(dto.topic);
    return {
      topic: dto.topic,
      subtopics,
    };
  }

  @Post("jobs")
  @ApiOperation({ summary: "Create and queue a new background generation job" })
  @ApiCreatedResponse({ description: "Job queued successfully" })
  async createJob(@Body() dto: CreateGenerationJobDto) {
    return this.jobService.createJob(dto);
  }

  @Get("jobs/:id")
  @ApiOperation({ summary: "Get status of a background generation job" })
  @ApiOkResponse({ description: "Job status retrieved successfully" })
  async getJob(@Param("id") id: string) {
    return this.jobService.getJob(id);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Get generation monitoring dashboard statistics" })
  @ApiOkResponse({ type: GenerationDashboardDto })
  async getDashboard(): Promise<GenerationDashboardDto> {
    const jobsCompleted = await this.prisma.generationJob.count({
      where: { status: "COMPLETED" },
    });

    const questionsGenerated = await this.prisma.question.count({
      where: { source: "GENERATED" },
    });

    const metrics = await this.prisma.generationMetrics.findFirst();
    const averageQuality = metrics ? metrics.averageQualityScore : 0.0;

    const totalJobs = await this.prisma.generationJob.count();
    const failedJobs = await this.prisma.generationJob.count({
      where: { status: "FAILED" },
    });
    const failureRate =
      totalJobs > 0
        ? Math.round((failedJobs / totalJobs) * 100 * 10) / 10
        : 0.0;

    const reviewQueueSize = await this.prisma.question.count({
      where: {
        status: { in: [QuestionStatus.DRAFT, QuestionStatus.VALIDATED] },
      },
    });

    return {
      jobsCompleted,
      questionsGenerated,
      averageQuality,
      failureRate,
      reviewQueueSize,
    };
  }
}
