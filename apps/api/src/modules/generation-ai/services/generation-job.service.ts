import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BatchGenerationService } from "../generators/batch-generation.service";
import { GenerationJob, Prisma } from "@prisma/client";

@Injectable()
export class GenerationJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchGenerationService: BatchGenerationService,
  ) {}

  async createJob(params: {
    topic: string;
    count: number;
    category?: string;
    difficulty?: string;
  }): Promise<GenerationJob> {
    const job = await this.prisma.generationJob.create({
      data: {
        topic: params.topic,
        count: params.count,
        generated: 0,
        status: "QUEUED",
      },
    });

    this.runJob(job.id, params);

    return job;
  }

  async getJob(id: string): Promise<GenerationJob> {
    const job = await this.prisma.generationJob.findUnique({
      where: { id },
    });
    if (!job) {
      throw new NotFoundException(`Generation job with ID ${id} not found`);
    }
    return job;
  }

  private async runJob(
    jobId: string,
    params: {
      topic: string;
      count: number;
      category?: string;
      difficulty?: string;
    },
  ): Promise<void> {
    try {
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: "RUNNING" },
      });

      const result = await this.batchGenerationService.generateBatch({
        topic: params.topic,
        count: params.count,
        category: params.category,
        difficulty: params.difficulty,
      });

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          generated: result.generated,
          result: {
            questionIds: result.questions.map((q) => q.id),
            report: result.report,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (e: any) {
      console.error(`Generation job ${jobId} failed:`, e);
      await this.prisma.generationJob
        .update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            error: e.message || String(e),
          },
        })
        .catch((logErr) =>
          console.error("Failed to mark job as failed in DB", logErr),
        );
    }
  }
}
