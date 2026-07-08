import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

export interface DuplicateResult {
  duplicate: boolean;
  similarity: number;
}

@Injectable()
export class DuplicateDetectorService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateJaccardSimilarity(textA: string, textB: string): number {
    const tokenize = (text: string) =>
      new Set(text.toLowerCase().split(/\W+/).filter(Boolean));
    const setA = tokenize(textA);
    const setB = tokenize(textB);

    if (setA.size === 0 && setB.size === 0) {
      return 1.0;
    }

    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersection++;
      }
    }

    const union = setA.size + setB.size - intersection;
    return intersection / union;
  }

  async checkDuplicate(
    generated: GeneratedQuestionDto,
  ): Promise<DuplicateResult> {
    const candidateText = (generated.question || "").trim();
    if (!candidateText) {
      return { duplicate: false, similarity: 0.0 };
    }

    // 1. Find topic in database by name or code matching generated.topic
    const topic = await this.prisma.topic.findFirst({
      where: {
        OR: [
          { name: { equals: generated.topic, mode: "insensitive" } },
          { code: { equals: generated.topic, mode: "insensitive" } },
        ],
      },
    });

    // 2. Fetch existing questions under that topic
    const existingQuestions = await this.prisma.question.findMany({
      where: topic ? { topicId: topic.id } : undefined,
      select: { questionText: true, templateId: true, metadata: true },
    });

    const candidateTemplateId = (generated.metadata as any)?.templateId || null;
    const candidateVars = (generated.metadata as any)?.variables || generated.metadata || {};

    const areVariableSetsEqual = (varsA: any, varsB: any): boolean => {
      if (!varsA || !varsB || typeof varsA !== "object" || typeof varsB !== "object") {
        return false;
      }
      const keysA = Object.keys(varsA).sort();
      const keysB = Object.keys(varsB).sort();
      if (keysA.length !== keysB.length) return false;
      return keysA.every((k, idx) => {
        if (keysB[idx] !== k) return false;
        return String(varsA[k]).trim().toLowerCase() === String(varsB[k]).trim().toLowerCase();
      });
    };

    let maxSimilarity = 0.0;

    for (const eq of existingQuestions) {
      const eqText = (eq.questionText || "").trim();
      if (!eqText) {
        continue;
      }

      // Exact Match check
      if (eqText.toLowerCase() === candidateText.toLowerCase()) {
        return { duplicate: true, similarity: 1.0 };
      }

      // Check duplicate variable sets for same template
      if (candidateTemplateId && eq.templateId === candidateTemplateId) {
        const eqVars = (eq.metadata as any)?.variables || eq.metadata || {};
        if (areVariableSetsEqual(candidateVars, eqVars)) {
          return { duplicate: true, similarity: 1.0 };
        }
      }

      // Jaccard similarity check
      const similarity = this.calculateJaccardSimilarity(candidateText, eqText);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }

      if (similarity > 0.85) {
        return { duplicate: true, similarity };
      }
    }

    return {
      duplicate: false,
      similarity: maxSimilarity,
    };
  }
}
