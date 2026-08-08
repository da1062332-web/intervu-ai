import { Injectable } from "@nestjs/common";
import { QueueService, QueueType } from "../../../queue";
import { TestRepository } from "../repositories/test.repository";
import { AssembledTestRepository } from "../../assembly/repositories/assembled-test.repository";
import { AppLogger } from "@intervu-ai/shared-logger";
import { GenerationRequest } from "@intervu-ai/contracts";
import { randomUUID } from "crypto";

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
        const existing = await this.assembledRepo.findByConfigId(
          body.blueprintId,
        );
        if (existing) {
          // Map assembledTest -> Assessment-like result used by frontend
          const questions: any[] = [];
          for (const s of existing.sections || []) {
            for (const q of s.questions || []) {
              const snap = (q.questionSnapshot as any) || {};
              questions.push({
                id: q.questionId,
                questionText: snap.questionText || snap.text || "",
                options: snap.options || [],
                answer: snap.correctAnswer || snap.correct_answer || null,
                explanation: snap.solution || snap.explanation || "",
                difficulty: (
                  snap.difficultyLevel ||
                  snap.difficulty ||
                  "MEDIUM"
                ).toUpperCase(),
                conceptKey: snap.conceptKey || null,
                topicId: snap.conceptKey || null,
              });
            }
          }

          const result = {
            testId: existing.id,
            title: existing.configId || "Published Assessment",
            companyId: "system",
            examConfigId: existing.configId,
            status: existing.status || "PUBLISHED",
            sections:
              existing.sections?.map((s: any) => {
                return {
                  id: s.id,
                  name: s.sectionName,
                  questions: s.questions.map((q: any) => {
                    const snap = (q.questionSnapshot as any) || {};
                    return {
                      id: q.questionId,
                      questionText: snap.questionText || "",
                      options: snap.options || [],
                      answer: snap.correctAnswer || null,
                      explanation: snap.solution || "",
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
      this.logger.warn("Failed to lookup existing assembled test", {
        error: message,
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
      this.logger.warn(
        "Queue service unavailable, falling back to direct DB question assembly",
        {
          error: String(enqueueError),
        },
      );
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
            questionText: q.questionText || q.text || "",
            options: mcqData.options || q.options || [],
            answer: q.answer || q.correctAnswer || null,
            explanation: q.explanation || q.solution || "",
            difficulty: (
              q.difficulty ||
              q.difficultyLevel ||
              "MEDIUM"
            ).toUpperCase(),
            conceptKey: q.conceptKey || q.topicId || "General",
            topicId: q.topicId || "default-topic",
          };
        });

        return {
          testId: `asmt_${randomUUID()}`,
          title: "Generated Assessment",
          companyId: "system",
          examConfigId: body.blueprintId,
          status: "COMPLETED",
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
