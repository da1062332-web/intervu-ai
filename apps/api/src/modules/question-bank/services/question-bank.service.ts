import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionRepository } from "../repositories/question.repository";
import { QuestionVersionService } from "./question-version.service";
import { QuestionReviewService } from "./question-review.service";

import {
  CreateQuestionDto,
  UpdateQuestionDto,
  BulkUploadDto,
} from "../dto/question-bank.dto";
import { Question, QuestionStatus, Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionRepo: QuestionRepository,
    private readonly versionService: QuestionVersionService,
    private readonly reviewService: QuestionReviewService,
  ) {}

  /**
   * Creates a single question in the bank, generating version snapshot and usage slot.
   */
  async createQuestion(dto: CreateQuestionDto): Promise<Question> {
    return this.prisma.$transaction(async (tx) => {
      const mcqData = dto.mcqData || (dto.options && dto.options.length > 0 ? { options: dto.options } : null);

      // 1. Create the question record (starts as DRAFT)
      const question = await this.questionRepo.create(
        {
          questionText: dto.questionText,
          answer: dto.answer,
          explanation: dto.explanation || "",
          topicId: dto.topicId,
          sectionId: dto.sectionId,
          conceptId: dto.conceptId || null,
          difficulty: dto.difficulty,
          source: dto.source || "MANUAL",
          questionSource: (dto.questionSource as any) || "MANUAL",
          questionType: dto.questionType || "MCQ",
          estimatedTime: dto.estimatedTime || null,
          questionTitle: dto.questionTitle || null,
          questionStatement: dto.questionStatement || null,
          instructions: dto.instructions || null,
          questionImage: dto.questionImage || null,
          attachments: dto.attachments || null,
          mcqData: mcqData,
          codingData: dto.codingData || null,
          templateId: dto.templateId || null,
          version: 1,
          status: dto.status || QuestionStatus.ACTIVE,
          metadata: dto.metadata || {},
        },
        tx,
      );

      // 2. Create initial version snapshot
      await this.versionService.createVersionSnapshot(question, tx);

      // 3. Create initial usage tracking record
      await tx.questionUsage.create({
        data: {
          questionId: question.id,
          timesUsed: 0,
          lastUsed: null,
          sectionUsage: {},
          examUsage: {},
        },
      });

      // 4. Legacy compatibility write (only if templateId is provided)
      if (dto.templateId) {
        await tx.generatedQuestion.create({
          data: {
            templateId: dto.templateId,
            questionHash: createId(), // Satisfy unique key constraint
            conceptKey: dto.topicId, // fallback to topicId

            difficultyLevel: dto.difficulty as any,
            questionType: "mcq",
            questionText: dto.questionText,
            options: dto.options || [dto.answer],
            correctAnswer: dto.answer,
            solution: dto.explanation || "",
            metadata: {},
          },
        });
      }

      return question;
    });
  }

  /**
   * Bulk persists up to 100 questions atomically under 2 seconds.
   */
  async createBulkQuestions(
    dto: BulkUploadDto,
  ): Promise<{ saved: number; failed: number }> {
    if (!dto.questions || dto.questions.length === 0) {
      return { saved: 0, failed: 0 };
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const questionsData: Prisma.QuestionCreateManyInput[] = [];
        const versionsData: Prisma.QuestionVersionCreateManyInput[] = [];
        const usagesData: Prisma.QuestionUsageCreateManyInput[] = [];
        const legacyData: Prisma.GeneratedQuestionCreateManyInput[] = [];

        const now = new Date();

        for (const q of dto.questions) {
          const qId = createId();
          const versionId = createId();
          const usageId = createId();

          // 1. Question base data
          questionsData.push({
            id: qId,
            questionText: q.questionText,
            answer: q.answer,
            explanation: q.explanation || "",
            topicId: q.topicId,
            sectionId: q.sectionId,
            difficulty: q.difficulty,
            source: q.source || "MANUAL",
            templateId: q.templateId || null,
            version: 1,
            status: QuestionStatus.DRAFT,
            createdAt: now,
            updatedAt: now,
          });

          // 2. Snapshot JSON for version history
          const snapshot = {
            id: qId,
            questionText: q.questionText,
            answer: q.answer,
            explanation: q.explanation || "",
            topicId: q.topicId,
            sectionId: q.sectionId,
            difficulty: q.difficulty,
            difficultyScore: null,
            source: q.source || "MANUAL",
            templateId: q.templateId || null,
            status: QuestionStatus.DRAFT,
            options: q.options || [],
          };

          versionsData.push({
            id: versionId,
            questionId: qId,
            version: 1,
            snapshot: snapshot as Prisma.InputJsonValue,
            createdAt: now,
          });

          // 3. Usage tracking slot
          usagesData.push({
            id: usageId,
            questionId: qId,
            timesUsed: 0,
            lastUsed: null,
            sectionUsage: {},
            examUsage: {},
            createdAt: now,
            updatedAt: now,
          });

          // 4. Legacy GeneratedQuestion (only if templateId is provided)
          if (q.templateId) {
            legacyData.push({
              id: createId(),
              templateId: q.templateId,
              questionHash: createId(),
              conceptKey: q.topicId,

              difficultyLevel: q.difficulty as any,
              questionType: "mcq",
              questionText: q.questionText,
              options: q.options || [q.answer],
              correctAnswer: q.answer,
              solution: q.explanation || "",
              metadata: {},
            });
          }
        }

        const count = await this.questionRepo.bulkInsert(
          {
            questions: questionsData,
            versions: versionsData,
            usages: usagesData,
            legacyQuestions: legacyData,
          },
          tx,
        );

        return { saved: count, failed: 0 };
      });
    } catch (error: any) {
      // Transaction automatically rolls back on error
      throw new BadRequestException({
        success: false,
        error: {
          code: "BULK_INSERT_FAILED",
          message: error.message || "Failed to bulk persist questions.",
        },
      });
    }
  }

  /**
   * Updates question properties, increments version, and writes version snapshot.
   */
  async updateQuestion(id: string, dto: UpdateQuestionDto): Promise<Question> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.questionRepo.findById(id);
      if (!existing) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // Check if status needs state check
      if (dto.status && dto.status !== existing.status) {
        // Handled by workflow services, but validate if update forces it
        if (
          dto.status === QuestionStatus.ACTIVE &&
          existing.status !== QuestionStatus.VALIDATED
        ) {
          throw new BadRequestException(
            `Cannot activate question from state ${existing.status}`,
          );
        }
      }

      const mcqData = dto.mcqData || (dto.options && dto.options.length > 0 ? { options: dto.options } : undefined);
      const cleanDto: any = { ...dto };
      delete cleanDto.options;

      if (cleanDto.conceptId === "" || cleanDto.conceptId === undefined) {
        delete cleanDto.conceptId;
      }
      if (cleanDto.sectionId === "" || cleanDto.sectionId === undefined) {
        delete cleanDto.sectionId;
      }
      if (cleanDto.topicId === "" || cleanDto.topicId === undefined) {
        delete cleanDto.topicId;
      }

      const updateData: Prisma.QuestionUncheckedUpdateInput = {
        ...cleanDto,
        ...(mcqData !== undefined ? { mcqData } : {}),
        questionSource: dto.questionSource ? (dto.questionSource as any) : undefined,
        version: { increment: 1 },
      };

      const updated = await this.questionRepo.update(id, updateData as any, tx);

      // Save snapshot of updated question state
      await this.versionService.createVersionSnapshot(updated, tx);

      return updated;
    });
  }

  /**
   * Soft-deletes a question by setting status to ARCHIVED.
   */
  async archiveQuestion(id: string): Promise<Question> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.questionRepo.findById(id);
      if (!existing) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      if (existing.status === QuestionStatus.ARCHIVED) {
        return existing;
      }

      const updated = await this.questionRepo.update(
        id,
        {
          status: QuestionStatus.ARCHIVED,
          version: { increment: 1 },
        },
        tx,
      );

      // Create snapshot
      await this.versionService.createVersionSnapshot(updated, tx);

      return updated;
    });
  }

  /**
   * Restores an archived question to DRAFT.
   */
  async restoreQuestion(id: string): Promise<Question> {
    return this.reviewService.restoreQuestion(id);
  }

  /**
   * Retrieves status metrics and counts.
   */
  /**
   * Retrieves random active questions for a given concept, difficulty, and count.
   */
  async getRandomQuestions(params: {
    conceptId: string;
    difficulty?: string;
    count?: number;
    excludeIds?: string[];
  }): Promise<Question[]> {
    const { conceptId, difficulty, count = 1, excludeIds = [] } = params;

    // Check if conceptId is UUID or conceptCode
    const conceptFilter: Prisma.ConceptWhereInput =
      conceptId.length === 36 || conceptId.includes("-")
        ? { id: conceptId }
        : { code: conceptId.toUpperCase() };

    const where: Prisma.QuestionWhereInput = {
      status: QuestionStatus.ACTIVE,
      concept: conceptFilter,
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    };

    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }

    const questions = await this.prisma.question.findMany({
      where,
      include: {
        concept: true,
        topic: true,
        section: true,
      },
    });

    // In-memory shuffle for random selection
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Retrieves status metrics and counts.
   */
  async getStats(filters: {
    topicId?: string;
    sectionId?: string;
  }): Promise<any> {
    const where: Prisma.QuestionWhereInput = {};
    if (filters.topicId) {
      where.topicId = filters.topicId;
    }
    if (filters.sectionId) {
      where.sectionId = filters.sectionId;
    }
    return this.questionRepo.getStats(where);
  }
}
