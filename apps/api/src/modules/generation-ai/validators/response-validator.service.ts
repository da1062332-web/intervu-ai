import { Injectable, BadRequestException } from "@nestjs/common";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

@Injectable()
export class ResponseValidatorService {
  /**
   * Validates the generated question DTO against schema, placeholder leakage, and MCQ constraints.
   */
  validate(
    question: GeneratedQuestionDto,
    requestedDifficulty: string,
    requestedTopic: string,
    template?: any,
  ): void {
    // 1. Basic Existence Checks
    if (!question) {
      throw new BadRequestException("Generated question is null or undefined");
    }

    if (!question.question || question.question.trim().length === 0) {
      throw new BadRequestException("Question text is empty or missing");
    }

    // Question length must be at least 10 characters as per contract spec
    if (question.question.trim().length < 10) {
      throw new BadRequestException("Question text must be at least 10 characters long");
    }

    const isMcq =
      question.options &&
      Array.isArray(question.options) &&
      question.options.length > 0;

    // 2. Answer Existence
    const correctAnswer = question.correctAnswer || (question as any).answer;
    if (!correctAnswer || String(correctAnswer).trim().length === 0) {
      throw new BadRequestException("Correct answer is empty or missing");
    }

    // 3. MCQ Option Verification
    if (isMcq) {
      const options = question.options!;
      if (options.length !== 4) {
        throw new BadRequestException(`MCQ question must have exactly 4 options, got ${options.length}`);
      }

      if (options.some((opt) => !opt || opt.trim().length === 0)) {
        throw new BadRequestException("MCQ options cannot contain empty or blank strings");
      }

      const uniqueOptions = new Set(options.map((opt) => opt.trim()));
      if (uniqueOptions.size !== options.length) {
        throw new BadRequestException("MCQ options contain duplicate values");
      }

      // Check that correctAnswer exactly matches one of the options
      const cleanAnswer = String(correctAnswer).trim();
      const cleanOptions = options.map((o) => o.trim());
      if (!cleanOptions.includes(cleanAnswer)) {
        throw new BadRequestException(
          `Correct answer "${cleanAnswer}" is not present in options: [${cleanOptions.join(", ")}]`,
        );
      }
    }

    // 4. Explanation Existence
    if (!question.explanation || question.explanation.trim().length === 0) {
      throw new BadRequestException("Explanation text is empty or missing");
    }

    // 5. Placeholder Leakage Scan (curly brace detection)
    const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/;
    if (placeholderRegex.test(question.question)) {
      throw new BadRequestException("Question text contains unresolved template placeholder tokens");
    }
    if (placeholderRegex.test(question.explanation)) {
      throw new BadRequestException("Explanation text contains unresolved template placeholder tokens");
    }
    if (isMcq && question.options!.some((opt) => placeholderRegex.test(opt))) {
      throw new BadRequestException("MCQ options contain unresolved template placeholder tokens");
    }

    // 6. Template Violations (Difficulty & Topic Alignment)
    const diff = (question.difficulty || "").toLowerCase();
    const reqDiff = requestedDifficulty.toLowerCase();
    if (diff && diff !== reqDiff) {
      throw new BadRequestException(
        `Difficulty mismatch: requested "${requestedDifficulty}" but got "${question.difficulty}"`,
      );
    }

    const topic = String(question.topic || (question.metadata && (question.metadata as any).topic) || "").toLowerCase();
    const reqTopic = requestedTopic.toLowerCase();
    if (topic && topic !== reqTopic && !reqTopic.includes(topic) && !topic.includes(reqTopic)) {
      throw new BadRequestException(
        `Topic alignment check failed: expected "${requestedTopic}" but got "${question.topic}"`,
      );
    }

    const strategy = template?.generationStrategy ||
                     question.metadata?.generationStrategy ||
                     ((question.metadata?.variables as any)?.generationStrategy) ||
                     "VARIABLE";

    switch (strategy.toUpperCase()) {
      case "VARIABLE":
        this.validateVariableStrategy(question, template);
        break;
      case "DATASET":
        this.validateDatasetStrategy(question, template);
        break;
      case "HYBRID":
        this.validateHybridStrategy(question, template);
        break;
    }
  }

  private validateVariableStrategy(question: GeneratedQuestionDto, template?: any): void {
    // 1. Math/Formula correctness: Ensure the LLM's correct answer matches the pre-calculated one.
    const variables = question.metadata?.variables;
    if (variables) {
      const computedAnswer = (variables as any).correctAnswer || (variables as any).answer;
      if (computedAnswer !== undefined) {
        const cleanComputed = String(computedAnswer).trim().toLowerCase();
        const cleanLlmAnswer = String(question.correctAnswer || question.answer).trim().toLowerCase();
        if (cleanLlmAnswer !== cleanComputed) {
          throw new BadRequestException(
            `Math validation failed: LLM generated answer "${cleanLlmAnswer}" does not match backend computed answer "${cleanComputed}"`
          );
        }
      }
    }
  }

  private validateDatasetStrategy(question: GeneratedQuestionDto, template?: any): void {
    // 2. Dataset checks: Ensure the question contains no placeholder tokens
    if (question.question.includes("{{") || question.question.includes("}}")) {
      throw new BadRequestException("Dataset validation failed: Question text contains raw template placeholders.");
    }
  }

  private validateHybridStrategy(question: GeneratedQuestionDto, template?: any): void {
    // 3. Hybrid checks: Ensure the question text references all the graph entities to prevent logical hallucination.
    const logicalGraph = question.metadata?.logicalGraph || (template as any)?.logicalGraph;
    if (logicalGraph && Array.isArray(logicalGraph.entities)) {
      for (const entity of logicalGraph.entities) {
        const entityClean = String(entity).trim();
        if (!question.question.includes(entityClean)) {
          throw new BadRequestException(
            `Logical reasoning validation failed: Question text does not reference entity "${entityClean}" from the relationship graph.`
          );
        }
      }
    }
  }
}
