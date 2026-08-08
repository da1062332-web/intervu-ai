import { Injectable } from "@nestjs/common";
import { QueueService, QueueType } from "../../../queue";
import { TestRepository } from "../repositories/test.repository";
import { AssembledTestRepository } from "../../assembly/repositories/assembled-test.repository";
import { AppLogger } from "@intervu-ai/shared-logger";
import { GenerationRequest } from "@intervu-ai/contracts";
import { createHash, randomUUID } from "crypto";

@Injectable()
export class TestAssemblyService {
  private logger = new AppLogger({ name: "TestAssemblyService" });

  constructor(
    private readonly queueService: QueueService,
    private readonly testRepository: TestRepository,
    private readonly assembledRepo: AssembledTestRepository,
  ) {}

  async getTest(id: string) {
    return this.testRepository.findById(id);
  }

  async generateQuestions(body: GenerationRequest) {
    // If a published/created assembled test exists for this blueprint, return it directly
    try {
      if (body.blueprintId) {
        const existing = await this.assembledRepo.findByConfigId(body.blueprintId);
        if (existing) {
          // Map assembledTest -> Assessment-like result used by frontend
          const questions: any[] = [];
          for (const s of existing.sections || []) {
            for (const q of s.questions || []) {
              const snap = (q.questionSnapshot as any) || {};
              questions.push({
                id: q.questionId,
                questionText: snap.questionText || snap.text || '',
                options: snap.options || [],
                answer: snap.correctAnswer || snap.correct_answer || null,
                explanation: snap.solution || snap.explanation || '',
                difficulty: (snap.difficultyLevel || snap.difficulty || 'MEDIUM').toUpperCase(),
                conceptKey: snap.conceptKey || null,
                topicId: snap.conceptKey || null,
              });
            }
          }

          const result = {
            testId: existing.id,
            title: existing.configId || 'Published Assessment',
            companyId: 'system',
            examConfigId: existing.configId,
            status: existing.status || 'PUBLISHED',
            sections:
              existing.sections?.map((s: any) => {
                return {
                  id: s.id,
                  name: s.sectionName,
                  questions: s.questions.map((q: any) => {
                    const snap = (q.questionSnapshot as any) || {};
                    return {
                      id: q.questionId,
                      questionText: snap.questionText || '',
                      options: snap.options || [],
                      answer: snap.correctAnswer || null,
                      explanation: snap.solution || '',
                    };
                  }),
                };
              }) || [],
            questions,
          };

          return result;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn('Failed to lookup existing assembled test', { error: message });
    }

    const idempotencyKey = createHash("sha256")
      .update(
        [
          body.blueprintId || "",
          body.sectionId || "",
          body.topicId || "",
          body.conceptId || "",
          body.templateId || "",
          body.difficulty || "",
          String(body.quantity ?? ""),
        ].join("|"),
      )
      .digest("hex");

    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      const existingActiveJob = await prisma.generationJob.findFirst({
        where: {
          idempotencyKey,
          status: { in: ["QUEUED", "RUNNING"] },
        },
      });
      await prisma.$disconnect();

      if (existingActiveJob) {
        this.logger.info("Reusing active generation job for identical request", {
          idempotencyKey,
          existingJobId: existingActiveJob.id,
          status: existingActiveJob.status,
        });
        return {
          jobId: existingActiveJob.id,
          topic: existingActiveJob.topic || body.topicId,
          difficulty: existingActiveJob.difficulty || body.difficulty,
          count: existingActiveJob.count || body.quantity,
          status: "queued",
        };
      }
    } catch (dedupeError) {
      this.logger.warn("Failed to evaluate existing active generation job", {
        error: dedupeError instanceof Error ? dedupeError.message : String(dedupeError),
        idempotencyKey,
      });
    }

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

    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.generationJob.create({
        data: {
          id: jobId,
          topic: topicId || body.topicId || "default-topic",
          count: body.quantity || 0,
          status: "QUEUED",
          difficulty: body.difficulty as string,
          idempotencyKey,
        },
      });
      await prisma.$disconnect();
    } catch (persistError) {
      const errorMessage =
        persistError instanceof Error ? persistError.message : String(persistError);
      this.logger.error(
        "Failed to persist generation job record before enqueue; aborting queue submission",
        { error: errorMessage, jobId },
      );
      throw new Error(
        `Failed to persist generation job record before enqueue: ${errorMessage}`,
      );
    }

    try {
      await this.queueService.enqueueGeneration({
        jobId,
        correlationId,
        timestamp: Date.now(),
        payload: {
          assemblyId: "test_123",
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
    } catch (enqueueError) {
      this.logger.warn("Queue service unavailable, falling back to direct DB question assembly", {
        error: String(enqueueError),
      });

      try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        await prisma.generationJob.update({
          where: { id: jobId },
          data: { status: "FALLBACK" },
        });
        await prisma.$disconnect();
      } catch (updateError) {
        this.logger.error("Failed to update generation job record after enqueue failure", updateError as Error, {
          jobId,
        });
      }
    }

    // Direct DB Question Assembly Fallback
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      const dbQuestions = await prisma.question.findMany({
        where: { status: "ACTIVE" },
        take: body.quantity || 5,
        orderBy: { createdAt: "desc" },
      });
      await prisma.$disconnect();

      if (dbQuestions.length > 0) {
        const questions = dbQuestions.map((q: any) => {
          const mcqData = (q.mcqData as any) || {};
          return {
            id: q.id,
            questionText: q.questionText || q.text || '',
            options: mcqData.options || q.options || [],
            answer: q.answer || q.correctAnswer || null,
            explanation: q.explanation || q.solution || '',
            difficulty: (q.difficulty || q.difficultyLevel || 'MEDIUM').toUpperCase(),
            conceptKey: q.conceptKey || q.topicId || 'General',
            topicId: q.topicId || 'default-topic',
          };
        });

        return {
          testId: `asmt_${randomUUID()}`,
          title: 'Generated Assessment',
          companyId: 'system',
          examConfigId: body.blueprintId,
          status: 'COMPLETED',
          questions,
        };
      }
    } catch (fallbackErr) {
      this.logger.error("Direct question fallback error", fallbackErr as Error);
    }

    return {
      jobId,
      topic: body.topicId,
      difficulty: body.difficulty,
      count: body.quantity,
      status: "queued",
    };
  }

  async getJobStatus(jobId: string) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      const dbJob = await prisma.generationJob.findUnique({
        where: { id: jobId },
      });
      await prisma.$disconnect();

      if (dbJob) {
        return {
          id: dbJob.id,
          status: dbJob.status || "unknown",
          progress: 0,
          result: dbJob.result ?? null,
          failedReason: dbJob.error || null,
        };
      }
    } catch (dbError) {
      this.logger.warn(
        "Failed to read generation job record from DB. Falling back to queue state.",
        {
          error: String(dbError),
        },
      );
    }

    const job = await this.queueService.getJob(QueueType.GENERATION, jobId);
    const state = await this.queueService.getJobState(
      QueueType.GENERATION,
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
