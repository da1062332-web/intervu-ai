import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { BlueprintRepository } from "../repositories/blueprint.repository";
import type {
  ExecutionReadyTestDto,
  ExecutionSectionDto,
  ExecutionQuestionDto,
  ExecutionScoringRules,
} from "../contracts/execution-ready.contract";

/**
 * TestPackageService — converts an AssembledTest into an ExecutionReadyTestDto.
 *
 * This service is the single handoff point from Module 3 (Assembly) to Module 4 (Execution).
 * Module 4 ONLY depends on ExecutionReadyTestDto — never on AssembledTest or TestInstance directly.
 *
 * Responsibilities:
 * - Load AssembledTest with all sections and questions
 * - Load ExamConfig for scoring rules and instructions
 * - Map all sections and questions to ExecutionSectionDto / ExecutionQuestionDto
 * - Extract question text/options/answer from questionSnapshot JSON
 * - Return a complete, self-contained ExecutionReadyTestDto
 *
 * This service does NOT persist. It is a pure transformation.
 */
@Injectable()
export class TestPackageService {
  private readonly logger = new Logger(TestPackageService.name);

  constructor(
    private readonly assembledTestRepository: AssembledTestRepository,
    private readonly blueprintRepository: BlueprintRepository,
  ) {}

  /**
   * Generate an execution-ready package from a persisted AssembledTest.
   *
   * @param assemblyId - ID of the AssembledTest record
   * @returns ExecutionReadyTestDto ready for Module 4
   * @throws NotFoundException if assembly does not exist
   */
  async generatePackage(assemblyId: string): Promise<ExecutionReadyTestDto> {
    // 1. Load assembly with full question data
    const assembly = await this.assembledTestRepository.findById(assemblyId);
    if (!assembly) {
      throw new NotFoundException(
        `Assembly ${assemblyId} not found. Cannot generate test package.`,
      );
    }

    this.logger.debug(
      `Generating package for assembly ${assemblyId} (${assembly.totalQuestions} questions)`,
    );

    // 2. Load ExamConfig for scoring rules
    let scoringRules: ExecutionScoringRules;
    try {
      const config = await this.blueprintRepository.getExamConfigForBlueprint(
        assembly.configId,
      );
      scoringRules = this.extractScoringRules(config);
    } catch {
      // Config not found — use safe defaults
      this.logger.warn(
        `ExamConfig ${assembly.configId} not found. Using default scoring rules.`,
      );
      scoringRules = this.defaultScoringRules();
    }

    // 3. Map sections and questions
    const sections: ExecutionSectionDto[] = (assembly.sections ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((section) => {
        const questions: ExecutionQuestionDto[] = (section.questions ?? [])
          .sort((a, b) => a.questionOrder - b.questionOrder)
          .map((q) => this.mapQuestion(q));

        return {
          sectionKey: section.sectionKey,
          displayName: section.sectionName,
          durationSeconds: section.durationSeconds,
          questionCount: section.questionCount,
          orderIndex: section.orderIndex,
          questions,
        };
      });

    const pkg: ExecutionReadyTestDto = {
      metadata: {},
      assemblyId: assembly.id,
      configId: assembly.configId,
      totalDurationSeconds: assembly.totalDurationSeconds,
      totalQuestions: assembly.totalQuestions,
      scoringRules,
      sections,
      packagedAt: new Date().toISOString(),
      assemblyStatus: assembly.status,
    };

    this.logger.log(
      `Package generated: assembly=${assemblyId}, sections=${sections.length}, ` +
        `questions=${assembly.totalQuestions}, status=${assembly.status}`,
    );

    return pkg;
  }

  /**
   * Map a persisted AssembledTestQuestion to ExecutionQuestionDto.
   * Full question data is extracted from the questionSnapshot JSON field.
   */
  private mapQuestion(q: {
    questionId: string;
    questionOrder: number;
    questionSnapshot: unknown;
  }): ExecutionQuestionDto {
    const snapshot = (q.questionSnapshot as Record<string, unknown>) ?? {};

    return {
      questionId: q.questionId,
      questionOrder: q.questionOrder,
      questionText: (snapshot["questionText"] as string) ?? "",
      questionType: (snapshot["questionType"] as string) ?? "MULTIPLE_CHOICE",
      difficulty: (snapshot["difficultyLevel"] as string) ?? "MEDIUM",
      topicId: (snapshot["conceptKey"] as string) ?? "",
      options: snapshot["options"],
      answer: snapshot["correctAnswer"],
      explanation: snapshot["solution"],
      snapshot: q.questionSnapshot,
    };
  }

  /**
   * Extract scoring rules from ExamConfig.
   * Maps ruleFlags JSON to strongly-typed ExecutionScoringRules.
   */
  private extractScoringRules(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any,
  ): ExecutionScoringRules {
    const flags = (config.ruleFlags as Record<string, unknown>) ?? {};

    return {
      negativeMarkingEnabled: Boolean(flags["negativeMarkingEnabled"] ?? false),
      sectionLockingEnabled: Boolean(flags["sectionLockingEnabled"] ?? false),
      shuffleQuestionsEnabled: Boolean(
        flags["shuffleQuestionsEnabled"] ?? false,
      ),
      shuffleOptionsEnabled: Boolean(flags["shuffleOptionsEnabled"] ?? false),
      allowNavigation: Boolean(flags["allowNavigation"] ?? true),
    };
  }

  /** Safe defaults for missing ExamConfig */
  private defaultScoringRules(): ExecutionScoringRules {
    return {
      negativeMarkingEnabled: false,
      sectionLockingEnabled: false,
      shuffleQuestionsEnabled: false,
      shuffleOptionsEnabled: false,
      allowNavigation: true,
    };
  }
}
