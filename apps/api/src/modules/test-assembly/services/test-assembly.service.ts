import { Injectable } from "@nestjs/common";
import { QueueService } from "../../../queue/queue.service";
import { TestRepository } from "../repositories/test.repository";
import { AppLogger } from "@intervu-ai/shared-logger";
import { GenerationRequest } from "@intervu-ai/contracts";
import { randomUUID } from "crypto";

@Injectable()
export class TestAssemblyService {
  private logger = new AppLogger({ name: "TestAssemblyService" });

  constructor(
    private readonly queueService: QueueService,
    private readonly testRepository: TestRepository,
  ) {}

  async getTest(id: string) {
    return this.testRepository.findById(id);
  }

  async generateQuestions(body: GenerationRequest) {
    const jobId = randomUUID();
    const correlationId = randomUUID(); // Ideally comes from Request Scope Context

    let topicId = body.topicId;
    if (topicId === "default-topic" || !topicId) {
      try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        const blueprint = await prisma.blueprint.findFirst({
          where: { configId: body.blueprintId },
        });
        if (blueprint) {
          const sections = (blueprint.sections as any) || [];
          if (sections.length > 0) {
            const topicAllocations = sections[0].topicAllocations || [];
            if (topicAllocations.length > 0) {
              topicId = topicAllocations[0].topicId || topicId;
            }
          }
        }
        await prisma.$disconnect();
      } catch (err) {
        this.logger.error(
          "Failed to resolve topicId from blueprint",
          err as Error,
        );
      }
    }

    this.logger.info(
      `Orchestrating question generation for topic: ${topicId}`,
      {
        jobId,
        correlationId,
      },
    );

    await this.queueService.enqueueGeneration({
      jobId,
      correlationId,
      timestamp: Date.now(),
      payload: {
        assemblyId: "test_123", // the older shared queue interface uses assemblyId
        topicId: topicId,
        difficulty: body.difficulty as string,
        count: body.quantity,
      },
    });

    return {
      jobId,
      topic: body.topicId,
      difficulty: body.difficulty,
      count: body.quantity,
      status: "queued",
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.queueService.getJob("GENERATION" as any, jobId);
    const state = await this.queueService.getJobState(
      "GENERATION" as any,
      jobId,
    );

    if (!job) {
      return { status: "unknown", progress: 0 };
    }

    let mappedResult = null;
    if (job.returnvalue && job.returnvalue.success) {
      const aiResult = job.returnvalue.result;
      const rawQuestions = aiResult?.questions || [];
      const mappedQuestions = rawQuestions.map((q: any, index: number) => ({
        id: q.id || `q_${index}_${Date.now()}`,
        questionText: q.text || q.questionText || "",
        options: q.options || [],
        answer: q.correctAnswer || q.answer || "",
        explanation: q.explanation || "No explanation provided.",
        difficulty: (q.difficulty || "MEDIUM").toUpperCase(),
        conceptKey: q.conceptKey || "standard",
        topicId: q.topic || q.topicId || "default-topic",
        sectionId: q.sectionId || "default-section",
      }));

      mappedResult = {
        testId: jobId,
        title: "AI Generated Assessment",
        companyId: "system",
        examConfigId: null,
        status: "COMPLETED",
        questions: mappedQuestions,
      };
    }

    return {
      id: job.id,
      status: state || "unknown",
      progress: job.progress || 0,
      result: mappedResult || job.returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }
}
