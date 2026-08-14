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

    // Resolve topicId and conceptId from template/concept if not explicitly provided
    let topicId = assembled.topicId;
    let conceptId: string | undefined;

    if ((assembled.metadata as any)?.conceptKey) {
      const concept = await this.prisma.concept.findFirst({
        where: {
          code: {
            equals: (assembled.metadata as any).conceptKey,
            mode: "insensitive",
          },
        },
      });
      if (concept) {
        conceptId = concept.id;
        if (!topicId) topicId = concept.topicId;
      }
    }

    if (!topicId && assembled.templateId) {
      const tmpl = await this.prisma.template.findUnique({
        where: { id: assembled.templateId },
      });
      if (tmpl?.conceptKey) {
        const concept = await this.prisma.concept.findFirst({
          where: { code: { equals: tmpl.conceptKey, mode: "insensitive" } },
        });
        if (concept) {
          conceptId = concept.id;
          if (!topicId) topicId = concept.topicId;
        }
      }
    }

    if (!topicId) {
      throw new Error(
        `Cannot save assembled question: No valid topicId could be resolved for template ${assembled.templateId}`,
      );
    }

    const meta = (assembled.metadata as Record<string, any>) || {};
    const oracleKey = meta.oracleKey || (meta.codingData as any)?.oracleKey;
    const isCoding = assembled.generationStrategy === "CODING_PATTERN" || !!oracleKey;

    let oracleInfo: any = null;
    if (oracleKey) {
      try {
        oracleInfo = await this.prisma.codingOracle.findUnique({
          where: { key: oracleKey },
        });
      } catch {
        // Continue if oracle lookup fails
      }
    }

    const codingData = isCoding
      ? {
          patternId: meta.patternId,
          patternKey: meta.patternKey,
          oracleKey: oracleKey,
          seed: meta.seed,
          parameters: meta.parameters,
          generatedInput: meta.generatedInput,
          expectedOutput: meta.expectedOutput,
          publicTests: meta.publicTests,
          hiddenTests: meta.hiddenTests,
          boundaryTests: meta.boundaryTests,
          stressTests: meta.stressTests,
          starterCode: meta.starterCode || {},
        }
      : undefined;

    const mergedMetadata = {
      ...meta,
      ...(oracleInfo
        ? {
            oracleName: oracleInfo.name,
            oracleCategory: oracleInfo.category,
            oracleDescription: oracleInfo.description,
          }
        : {}),
    };

    const aiStatement = meta.aiStatement;
    const title = aiStatement?.title || meta.title || meta.questionTitle;
    const statement = aiStatement?.narrative || meta.narrative || meta.questionStatement;

    let templateIdToSave: string | undefined = assembled.templateId;
    if (isCoding) {
      if (meta.conceptKey && !templateIdToSave) {
        try {
          const tmpl = await this.prisma.template.findFirst({
            where: { conceptKey: { equals: meta.conceptKey, mode: "insensitive" } },
          });
          templateIdToSave = tmpl?.id;
        } catch {}
      } else if (assembled.templateId) {
        // Verify templateId exists in Template table before saving to prevent foreign key violation
        try {
          const exists = await this.prisma.template.findUnique({
            where: { id: assembled.templateId },
          });
          if (!exists) templateIdToSave = undefined;
        } catch {
          templateIdToSave = undefined;
        }
      }
    }

    const instructions = isCoding
      ? JSON.stringify({
          constraints:
            aiStatement?.constraintsDescription ||
            "Standard time O(N) and space O(1) constraints apply.",
          testCases: JSON.stringify(
            (meta.publicTests || []).map((t: any) => ({
              input:
                typeof t.input === "object"
                  ? JSON.stringify(t.input)
                  : String(t.input),
              output:
                typeof t.expectedOutput === "object" &&
                t.expectedOutput.result !== undefined
                  ? String(t.expectedOutput.result)
                  : JSON.stringify(t.expectedOutput),
            })),
            null,
            2,
          ),
        })
      : undefined;

    return this.prisma.question.create({
      data: {
        questionText: assembled.questionText,
        questionTitle: title,
        questionStatement: statement,
        instructions,
        answer: assembled.correctAnswer,
        explanation: assembled.explanation,
        difficulty: assembled.difficulty,
        source: assembled.source,
        questionType: isCoding ? "CODING" : "MCQ",
        templateId: templateIdToSave,
        topicId,
        conceptId,
        sectionId,
        codingData: codingData as any,
        mcqData: !isCoding && assembled.options?.length ? { options: assembled.options } : undefined,
        metadata: mergedMetadata as any,
        status: isCoding ? "ACTIVE" : "DRAFT",
      },
    });
  }
}
