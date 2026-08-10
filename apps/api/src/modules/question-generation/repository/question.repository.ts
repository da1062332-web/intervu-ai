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
    let conceptId: string | undefined;

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
          conceptId = concept.id;
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
        conceptId = conceptId ?? concept.id;   // only overwrite if not already set
      }
    }

    if (!topicId) {
      throw new Error(
        `Cannot save assembled question: No valid topicId could be resolved for template ${assembled.templateId}`,
      );
    }

    const isCoding = assembled.generationStrategy === "CODING_PATTERN";
    const codingData = isCoding
      ? {
          patternId: (assembled.metadata as any)?.patternId,
          patternKey: (assembled.metadata as any)?.patternKey,
          oracleKey: (assembled.metadata as any)?.oracleKey,
          seed: (assembled.metadata as any)?.seed,
          parameters: (assembled.metadata as any)?.parameters,
          generatedInput: (assembled.metadata as any)?.generatedInput,
          expectedOutput: (assembled.metadata as any)?.expectedOutput,
          publicTests: (assembled.metadata as any)?.publicTests,
          hiddenTests: (assembled.metadata as any)?.hiddenTests,
          boundaryTests: (assembled.metadata as any)?.boundaryTests,
          stressTests: (assembled.metadata as any)?.stressTests,
          starterCode: (assembled.metadata as any)?.starterCode,
        }
      : undefined;

    return this.prisma.question.create({
      data: {
        questionText: assembled.questionText,
        answer: assembled.correctAnswer,
        explanation: assembled.explanation,
        difficulty: assembled.difficulty,
        source: assembled.source,
        questionType: isCoding ? "CODING" : "MCQ",
        templateId: assembled.templateId,
        topicId,
        conceptId,
        sectionId,
        codingData: codingData as any,
        metadata: assembled.metadata as any,
        status: "DRAFT",
      },
    });
  }
}
