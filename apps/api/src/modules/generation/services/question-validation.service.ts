import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ValidationResult } from "../dto/generation.dto";
import { DifficultyLevel } from "@prisma/client";

interface ValidationInput {
  questionText: string;
  answer: string;
  explanation: string;
  options: string[];
  difficulty: string;
  metadata: {
    templateId: string;
    templateKey: string;
    conceptKey: string;
    version: number;
    parameters: Record<string, any>;
  };
  requestedDifficulty: string;
  topicId: string;
}

@Injectable()
export class QuestionValidationService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Performs structural, topic, difficulty, and template contract checks.
   */
  async validateQuestion(input: ValidationInput): Promise<ValidationResult> {
    const errors: string[] = [];

    // 1. Structural Checks
    this.checkStructure(input, errors);

    // 2. Topic Check (Validate that the conceptKey maps to the selected topic)
    await this.checkTopic(input, errors);

    // 3. Difficulty Check
    this.checkDifficulty(input, errors);

    // 4. Template Contract Check (Validate variables match schema)
    await this.checkTemplateContract(input, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Structural checks (empty strings, MCQ option validations, duplicate options)
   */
  private checkStructure(input: ValidationInput, errors: string[]): void {
    const { questionText, answer, options, metadata } = input;

    if (!questionText || questionText.trim().length === 0) {
      errors.push("Question text is empty or missing");
    }

    if (!answer || answer.trim().length === 0) {
      errors.push("Correct answer is empty or missing");
    }

    if (!metadata || !metadata.templateId || !metadata.parameters) {
      errors.push(
        "Metadata is malformed or missing required templateId and parameters",
      );
    }

    // MCQ Specific Checks
    if (options && options.length > 0) {
      if (options.length < 2) {
        errors.push("Multiple choice questions must have at least 2 options");
      }

      // Check unique options
      const uniqueOpts = new Set(options);
      if (uniqueOpts.size !== options.length) {
        errors.push("Options contain duplicate choices");
      }

      // Check answer is in options
      if (!options.includes(answer)) {
        errors.push(
          "The correct answer does not match any of the provided options",
        );
      }
    }
  }

  /**
   * Topic verification (checks concept Key belongs to topicId concept mappings)
   */
  private async checkTopic(
    input: ValidationInput,
    errors: string[],
  ): Promise<void> {
    const { topicId, metadata } = input;
    if (!topicId || !metadata?.conceptKey) return;

    const mapping = await this.prismaService.concept.findFirst({
      where: {
        topicId,
        code: metadata.conceptKey,
        status: "ACTIVE",
      },
    });

    if (!mapping) {
      errors.push(
        `Concept key '${metadata.conceptKey}' does not belong to topic ID ${topicId}`,
      );
    }
  }

  /**
   * Difficulty distribution alignment verification
   */
  private checkDifficulty(input: ValidationInput, errors: string[]): void {
    const { difficulty, requestedDifficulty } = input;
    if (!difficulty || !requestedDifficulty) return;

    if (difficulty.toUpperCase() !== requestedDifficulty.toUpperCase()) {
      errors.push(
        `Generated difficulty '${difficulty}' does not match requested difficulty '${requestedDifficulty}'`,
      );
    }
  }

  /**
   * Template schema contract validation
   */
  private async checkTemplateContract(
    input: ValidationInput,
    errors: string[],
  ): Promise<void> {
    const { metadata } = input;
    if (!metadata?.templateId || !metadata?.parameters) return;

    const template = await this.prismaService.template.findUnique({
      where: { id: metadata.templateId },
      include: {
        variables: true,
      },
    });

    if (!template) {
      errors.push(`Template with ID ${metadata.templateId} not found`);
      return;
    }

    // Verify all required template variables exist in parameters
    const variables = template.variables || [];
    const params = metadata.parameters;

    for (const variable of variables) {
      if (variable.required && !params.hasOwnProperty(variable.variableName)) {
        errors.push(
          `Required variable '${variable.variableName}' is missing from generated parameters`,
        );
      }
    }
  }
}
