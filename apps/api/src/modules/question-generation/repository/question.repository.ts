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

    // Resolve topicId from template/concept if not explicitly provided
    let topicId = assembled.topicId;
    if (!topicId && assembled.templateId) {
      const tmpl = await this.prisma.template.findUnique({
        where: { id: assembled.templateId },
      });
      if (tmpl?.conceptKey) {
        const concept = await this.prisma.concept.findFirst({
          where: { code: { equals: tmpl.conceptKey, mode: "insensitive" } },
        });
        if (concept?.topicId) {
          topicId = concept.topicId;
        }
      }
    }

    if (!topicId && (assembled.metadata as any)?.conceptKey) {
      const concept = await this.prisma.concept.findFirst({
        where: {
          code: {
            equals: (assembled.metadata as any).conceptKey,
            mode: "insensitive",
          },
        },
      });
      if (concept?.topicId) {
        topicId = concept.topicId;
      }
    }

    if (!topicId) {
      throw new Error(
        `Cannot save assembled question: No valid topicId could be resolved for template ${assembled.templateId}`,
      );
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
