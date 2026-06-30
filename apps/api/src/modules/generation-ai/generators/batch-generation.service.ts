import { Injectable } from "@nestjs/common";
import { GenerationOrchestratorService } from "../orchestrators/generation-orchestrator.service";
import { GenerationQualityService, GenerationQualityReport } from "../evaluators/generation-quality.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

@Injectable()
export class BatchGenerationService {
  constructor(
    private readonly orchestrator: GenerationOrchestratorService,
    private readonly qualityEvaluator: GenerationQualityService,
  ) {}

  async generateBatch(params: {
    topic: string;
    count: number;
    category?: string;
    difficulty?: string;
  }): Promise<{ generated: number; questions: any[]; report: GenerationQualityReport }> {
    const { topic, count, category, difficulty } = params;

    const result = await this.orchestrator.generateQuestions({
      topic,
      count,
      category,
      difficulty,
    });

    const dtos: GeneratedQuestionDto[] = result.questions.map((q) => ({
      question: q.questionText,
      answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      topic,
    }));

    const report = await this.qualityEvaluator.evaluateBatch(
      dtos,
      topic,
      difficulty || "Medium",
    );

    return {
      generated: result.questions.length,
      questions: result.questions,
      report,
    };
  }
}
