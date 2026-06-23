import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { QuestionRepository } from "../repositories/question.repository";
import { QuestionReviewRepository } from "../repositories/question-review.repository";
import { QuestionVersionService } from "./question-version.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionStatus } from "@prisma/client";

@Injectable()
export class QuestionReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionRepo: QuestionRepository,
    private readonly reviewRepo: QuestionReviewRepository,
    private readonly versionService: QuestionVersionService,
  ) {}

  /**
   * Approves a question to ACTIVE status.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async approveQuestion(id: string, notes?: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const question = await this.questionRepo.findById(id);
      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      if (question.status !== QuestionStatus.VALIDATED) {
        throw new BadRequestException(
          `Cannot approve question in status ${question.status}. Allowed source status is VALIDATED.`,
        );
      }

      // Update question status and increment version
      const updated = await this.questionRepo.update(
        id,
        {
          status: QuestionStatus.ACTIVE,
          version: { increment: 1 },
        },
        tx,
      );

      // Create snapshot for audit trail
      await this.versionService.createVersionSnapshot(updated, tx);

      // Save review logs
      await this.reviewRepo.create(
        {
          questionId: id,
          status: "APPROVED",
          notes,
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Rejects a question and marks it back to DRAFT status.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async rejectQuestion(id: string, notes?: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const question = await this.questionRepo.findById(id);
      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      if (
        question.status !== QuestionStatus.VALIDATED &&
        question.status !== QuestionStatus.ACTIVE
      ) {
        throw new BadRequestException(
          `Cannot reject question in status ${question.status}. Allowed source statuses are VALIDATED or ACTIVE.`,
        );
      }

      // Update status to DRAFT and increment version
      const updated = await this.questionRepo.update(
        id,
        {
          status: QuestionStatus.DRAFT,
          version: { increment: 1 },
        },
        tx,
      );

      // Create snapshot
      await this.versionService.createVersionSnapshot(updated, tx);

      // Save review logs
      await this.reviewRepo.create(
        {
          questionId: id,
          status: "REJECTED",
          notes,
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Restores an ARCHIVED question back to DRAFT status.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async restoreQuestion(id: string, notes?: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const question = await this.questionRepo.findById(id);
      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      if (question.status !== QuestionStatus.ARCHIVED) {
        throw new BadRequestException(
          `Cannot restore question in status ${question.status}. Allowed source status is ARCHIVED.`,
        );
      }

      // Update status to DRAFT and increment version
      const updated = await this.questionRepo.update(
        id,
        {
          status: QuestionStatus.DRAFT,
          version: { increment: 1 },
        },
        tx,
      );

      // Create snapshot
      await this.versionService.createVersionSnapshot(updated, tx);

      // Save review logs
      await this.reviewRepo.create(
        {
          questionId: id,
          status: "RESTORED",
          notes: notes || "Restored from ARCHIVED status",
        },
        tx,
      );

      return updated;
    });
  }
}
