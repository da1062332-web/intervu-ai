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

    this.logger.info(
      `Orchestrating question generation for topic: ${body.topicId}`,
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
        topicId: body.topicId,
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
}
