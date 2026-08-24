import { Injectable, BadRequestException } from "@nestjs/common";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { isAnswerReferencedInExplanation } from "../generators/explanation-generator.service";

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
      throw new BadRequestException(
        "Question text must be at least 10 characters long",
      );
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
        throw new BadRequestException(
          `MCQ question must have exactly 4 options, got ${options.length}`,
        );
      }

      if (options.some((opt) => !opt || opt.trim().length === 0)) {
        throw new BadRequestException(
          "MCQ options cannot contain empty or blank strings",
        );
      }

      const uniqueOptions = new Set(options.map((opt) => opt.trim()));
      if (uniqueOptions.size !== options.length) {
        throw new BadRequestException("MCQ options contain duplicate values");
      }

      const obviousNonsense = /(lorem|todo|xyz|asdf|qwerty|nonsense)/i;
      if (options.some((opt) => obviousNonsense.test(opt))) {
        throw new BadRequestException(
          "MCQ options contain obviously nonsensical distractors",
        );
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

    const explanation = String(question.explanation).trim();
    const answerValue = String(correctAnswer).trim();
    const hasConcept = /concept/i.test(explanation);
    const hasFormula = /formula|reasoning/i.test(explanation);
    const hasSteps = /step-by-step|solution/i.test(explanation);
    const hasFinalAnswer = /final answer|answer/i.test(explanation);

    // Allow short explanations that directly state the final answer (common for simple MCQs),
    // but enforce the full heading structure for longer explanations.
    const minimalExplanationOk =
      explanation.length < 120 &&
      answerValue &&
      explanation.toLowerCase().includes(answerValue.toLowerCase());

    if (
      !(
        (hasConcept && hasFormula && hasSteps && hasFinalAnswer) ||
        minimalExplanationOk
      )
    ) {
      throw new BadRequestException(
        "Explanation must include Concept, Formula / Reasoning, Step-by-Step Solution, and Final Answer sections",
      );
    }

    if (
      answerValue &&
      !isAnswerReferencedInExplanation(explanation, answerValue)
    ) {
      throw new BadRequestException(
        `Explanation alignment check failed: The correct answer "${answerValue}" is not referenced in the explanation body.`,
      );
    }

    // 5. Placeholder Leakage Scan — detect double-brace Handlebars-style tokens like {{variable}}
    //    Single-brace patterns like {x} or {profit} are valid in math/LaTeX LLM output and must NOT be flagged.
    const placeholderRegex = /\{\{([a-zA-Z0-9_]+)\}\}/;
    if (placeholderRegex.test(question.question)) {
      throw new BadRequestException(
        "Question text contains unresolved template placeholder tokens",
      );
    }
    if (placeholderRegex.test(question.explanation)) {
      throw new BadRequestException(
        "Explanation text contains unresolved template placeholder tokens",
      );
    }
    if (isMcq && question.options!.some((opt) => placeholderRegex.test(opt))) {
      throw new BadRequestException(
        "MCQ options contain unresolved template placeholder tokens",
      );
    }

    // 6. Template Violations (Difficulty & Topic Alignment)
    const diff = (question.difficulty || "").toLowerCase();
    const reqDiff = requestedDifficulty.toLowerCase();
    if (diff && diff !== reqDiff) {
      throw new BadRequestException(
        `Difficulty mismatch: requested "${requestedDifficulty}" but got "${question.difficulty}"`,
      );
    }

    const topic = String(
      question.topic ||
        (question.metadata && (question.metadata as any).topic) ||
        "",
    ).toLowerCase();
    const reqTopic = requestedTopic.toLowerCase();
    if (
      topic &&
      topic !== reqTopic &&
      !reqTopic.includes(topic) &&
      !topic.includes(reqTopic)
    ) {
      throw new BadRequestException(
        `Topic alignment check failed: expected "${requestedTopic}" but got "${question.topic}"`,
      );
    }

    const strategy =
      template?.generationStrategy ||
      question.metadata?.generationStrategy ||
      (question.metadata?.variables as any)?.generationStrategy ||
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

  private validateVariableStrategy(
    question: GeneratedQuestionDto,
    template?: any,
  ): void {
    // 1. Math/Formula correctness: Ensure the LLM's correct answer matches the pre-calculated one.
    const variables = question.metadata?.variables;
    if (variables) {
      const computedAnswer =
        (variables as any).correctAnswer || (variables as any).answer;
      if (computedAnswer !== undefined) {
        const cleanComputed = String(computedAnswer).trim().toLowerCase();
        const cleanLlmAnswer = String(question.correctAnswer || question.answer)
          .trim()
          .toLowerCase();
        if (!this.answersMatch(cleanLlmAnswer, cleanComputed)) {
          throw new BadRequestException(
            `Math validation failed: LLM generated answer "${cleanLlmAnswer}" does not match backend computed answer "${cleanComputed}"`,
          );
        }
      }
    }
  }

  private answersMatch(llmAnswer: string, computedAnswer: string): boolean {
    if (llmAnswer === computedAnswer) {
      return true;
    }

    const llmNumeric = this.parseNumericAnswer(llmAnswer);
    const computedNumeric = this.parseNumericAnswer(computedAnswer);
    if (llmNumeric === null || computedNumeric === null) {
      return false;
    }

    return Math.abs(llmNumeric - computedNumeric) <= 0.01;
  }

  private parseNumericAnswer(value: string): number | null {
    const normalized = value
      .replace(/,/g, "")
      .replace(/^(?:rs\.?|inr|₹|rupees?)\s*/i, "")
      .replace(/\s*(?:rs\.?|inr|₹|rupees?)$/i, "")
      .trim();

    if (!/^-?\d+(?:\.\d+)?%?$/.test(normalized)) {
      return null;
    }

    const numeric = Number(normalized.replace(/%$/, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }

  private calculateJaccardSimilarity(textA: string, textB: string): number {
    const tokenize = (text: string) =>
      new Set(text.toLowerCase().split(/\W+/).filter(Boolean));
    const setA = tokenize(textA);
    const setB = tokenize(textB);
    if (setA.size === 0 && setB.size === 0) return 1.0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return intersection / union;
  }

  private validateDatasetStrategy(
    question: GeneratedQuestionDto,
    template?: any,
  ): void {
    // 1. Placeholder check
    if (question.question.includes("{{") || question.question.includes("}}")) {
      throw new BadRequestException(
        "Dataset validation failed: Question text contains raw template placeholders.",
      );
    }

    // 2. Self-containment check
    const qText = (question.question || "").trim();
    if (qText.length < 10) {
      throw new BadRequestException(
        "Dataset validation failed: Generated question text is too short to be self-contained.",
      );
    }

    // 3. Uniqueness / Anti-Copying check against original dataset reference item
    const dsItem = question.metadata?.datasetItem as any;
    const dsContent = (dsItem?.content || dsItem?.questionText || "").trim();
    if (dsContent && dsContent.length > 30) {
      const similarity = this.calculateJaccardSimilarity(qText, dsContent);
      if (similarity > 0.85) {
        throw new BadRequestException(
          `Dataset validation failed: Generated question is too similar to the source dataset reference item (similarity: ${similarity.toFixed(2)}). The model must generate a new scenario with different entities, wording, and options.`,
        );
      }
    }
  }

  private validateHybridStrategy(
    question: GeneratedQuestionDto,
    template?: any,
  ): void {
    // 3. Hybrid checks: Ensure the question text references all the graph entities to prevent logical hallucination.
    const logicalGraph =
      question.metadata?.logicalGraph || (template as any)?.logicalGraph;
    if (logicalGraph && Array.isArray(logicalGraph.entities)) {
      for (const entity of logicalGraph.entities) {
        const entityClean = String(entity).trim();
        if (!question.question.includes(entityClean)) {
          throw new BadRequestException(
            `Logical reasoning validation failed: Question text does not reference entity "${entityClean}" from the relationship graph.`,
          );
        }
      }
    }
  }
}
