import { Injectable } from "@nestjs/common";
import { QuestionVersionRepository } from "../repositories/question-version.repository";
import { Question, QuestionVersion, Prisma } from "@prisma/client";

@Injectable()
export class QuestionVersionService {
  constructor(private readonly versionRepo: QuestionVersionRepository) {}

  /**
   * Captures a snapshot of the current state of a question and saves it in question_versions.
   */
  async createVersionSnapshot(
    question: Question & { options?: string[] },
    tx?: Prisma.TransactionClient,
  ): Promise<QuestionVersion> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot: Record<string, any> = {
      id: question.id,
      questionText: question.questionText,
      answer: question.answer,
      explanation: question.explanation,
      topicId: question.topicId,
      sectionId: question.sectionId,
      difficulty: question.difficulty,
      difficultyScore: question.difficultyScore,
      source: question.source,
      templateId: question.templateId,
      status: question.status,
      options: question.options || [],
    };

    return this.versionRepo.create(
      {
        questionId: question.id,
        version: question.version,
        snapshot: snapshot as Prisma.InputJsonValue,
      },
      tx,
    );
  }

  /**
   * Retrieves the version history for a question.
   */
  async getVersions(questionId: string): Promise<QuestionVersion[]> {
    return this.versionRepo.findByQuestionId(questionId);
  }
}
