import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AssembledQuestion } from "../assembler/question-assembler.service";

/**
 * QuestionRepository
 *
 * The ONLY service in this module that writes to the questions table.
 * QuestionAssembler knows nothing about persistence — SRP enforced.
 */
@Injectable()
export class QuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(assembled: AssembledQuestion): Promise<any> {
    // Use the first available section if sectionId is not provided.
    // In production, this should be passed from template configuration.
    let sectionId = assembled.sectionId;
    if (!sectionId) {
      const section = await this.prisma.examSection.findFirst();
      sectionId = section?.id ?? "default";
    }

    // Use the first available topic if topicId is not provided.
    let topicId = assembled.topicId;
    if (!topicId) {
      const topic = await this.prisma.topic.findFirst();
      topicId = topic?.id ?? "default";
    }

    return this.prisma.question.create({
      data: {
        questionText: assembled.questionText,
        answer: assembled.correctAnswer,
        explanation: assembled.explanation,
        difficulty: assembled.difficulty,
        source: assembled.source,
        templateId: assembled.templateId,
        topicId,
        sectionId,
        metadata: assembled.metadata as any,
        status: "DRAFT",
      },
    });
  }
}
