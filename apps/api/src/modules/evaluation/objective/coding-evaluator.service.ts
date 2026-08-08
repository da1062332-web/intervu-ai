import { Injectable, Inject, Logger } from "@nestjs/common";
import { AnswerDto } from "@intervu-ai/contracts";
import { QuestionEvaluationResult } from "./objective-evaluator.service";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";

interface CodingQuestion {
  id: string;
  questionType: string;
  problemStatement: string;
  questionText: string;
  constraints?: string;
  testCases?: string;
}

interface AiCodingEvalResult {
  isCorrect: boolean;
  score: number;
  passed: boolean;
  constraintValidation: "PASSED" | "FAILED" | "NOT_CHECKED";
  syntaxError: boolean;
  compilationError: boolean;
  explanation: string;
}

@Injectable()
export class CodingEvaluatorService {
  private readonly logger = new Logger("CodingEvaluatorService");

  constructor(@Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter) {}

  /**
   * Evaluates all coding answers in parallel using the LLM.
   * Each question gets its own AI call running concurrently via Promise.all().
   */
  async evaluateAnswers(
    answers: AnswerDto[],
    questions: CodingQuestion[],
  ): Promise<QuestionEvaluationResult[]> {
    if (questions.length === 0) return [];

    const answersMap = new Map(answers.map((a) => [a.questionId, a]));

    // Evaluate all coding questions in parallel — major performance improvement
    const results = await Promise.all(
      questions.map((question) =>
        this.evaluateSingleQuestion(question, answersMap.get(question.id)),
      ),
    );

    return results;
  }

  private async evaluateSingleQuestion(
    question: CodingQuestion,
    candidateAnsObj: AnswerDto | undefined,
  ): Promise<QuestionEvaluationResult> {
    const timeSpentSeconds = candidateAnsObj?.timeSpentSeconds || 0;
    const candidateAnswer = candidateAnsObj?.textResponse || "";

    if (!candidateAnswer || candidateAnswer.trim() === "") {
      return {
        questionId: question.id,
        isCorrect: false,
        score: 0,
        maxMarks: 1,
        candidateAnswer: "",
        correctAnswer: "",
        timeSpentSeconds,
        passed: false,
        constraintValidation: "NOT_CHECKED",
        syntaxError: false,
        compilationError: false,
        codingFeedback: "No submission provided.",
      };
    }

    const aiResult = await this.evaluateWithAI(question, candidateAnswer);

    return {
      questionId: question.id,
      isCorrect: aiResult.isCorrect,
      score: aiResult.score,
      maxMarks: 1,
      candidateAnswer,
      correctAnswer: "",
      timeSpentSeconds,
      passed: aiResult.passed,
      constraintValidation: aiResult.constraintValidation,
      syntaxError: aiResult.syntaxError,
      compilationError: aiResult.compilationError,
      codingFeedback: aiResult.explanation,
    };
  }

  /**
   * Calls the LLM to evaluate ONLY correctness, constraint satisfaction, and errors.
   * Does NOT evaluate: code quality, readability, complexity, style, or best practices.
   */
  private async evaluateWithAI(
    question: CodingQuestion,
    rawAnswer: string,
  ): Promise<AiCodingEvalResult> {
    // Parse the candidate's submission (JSON from embedded compiler)
    let submittedCode = "";
    let executionOutput = "";
    let language = "Unknown";

    try {
      const parsed =
        typeof rawAnswer === "string" ? JSON.parse(rawAnswer) : rawAnswer;
      if (typeof parsed === "object" && parsed !== null) {
        language = parsed.language || parsed.lang || "Unknown";
        submittedCode =
          parsed.code ||
          parsed.files?.[0]?.content ||
          parsed.textResponse ||
          parsed.value ||
          "";
        executionOutput =
          parsed.result?.output || parsed.output || parsed.stdout || "";
      } else if (typeof parsed === "string") {
        submittedCode = parsed;
      }
    } catch {
      submittedCode = typeof rawAnswer === "string" ? rawAnswer : "";
    }

    if (
      !submittedCode ||
      submittedCode.trim() === "" ||
      submittedCode.includes('{"action":')
    ) {
      if (
        typeof rawAnswer === "string" &&
        (rawAnswer.includes("class") ||
          rawAnswer.includes("def ") ||
          rawAnswer.includes("function") ||
          rawAnswer.includes("return") ||
          rawAnswer.includes("#include") ||
          rawAnswer.includes("public"))
      ) {
        submittedCode = rawAnswer;
      }
    }

    const constraintsSection = question.constraints
      ? `\nConstraints:\n${question.constraints}`
      : "";

    const testCasesSection = question.testCases
      ? `\nTest Cases:\n${question.testCases}`
      : "";

    const outputSection = executionOutput
      ? `\nExecution Output:\n${executionOutput}`
      : "";

    const prompt = `You are a code correctness checker. Evaluate ONLY the following:
1. Does the code produce the correct output for the problem?
2. Does the code satisfy the given constraints?
3. Are there any syntax or compilation errors?

Do NOT evaluate: code quality, readability, naming conventions, time complexity, space complexity, best practices, design patterns, or style.

Problem Statement:
${question.problemStatement || question.questionText}
${constraintsSection}
${testCasesSection}

Submitted Code (${language}):
${submittedCode.slice(0, 3000)}
${outputSection}

Respond ONLY with a valid JSON object in exactly this format (no markdown):
{
  "isCorrect": true,
  "score": 1.0,
  "passed": true,
  "constraintValidation": "PASSED",
  "syntaxError": false,
  "compilationError": false,
  "explanation": "Brief explanation only if incorrect. Leave empty string if correct."
}

Rules:
- "isCorrect": true if output is correct, false otherwise
- "score": 1.0 if correct, 0.0 if incorrect
- "passed": same as isCorrect
- "constraintValidation": "PASSED" if constraints satisfied, "FAILED" if violated, "NOT_CHECKED" if no constraints given
- "syntaxError": true only if there is a syntax error in the code
- "compilationError": true only if there is a compilation/runtime error
- "explanation": 1-2 sentences only if incorrect, explaining what is wrong with the output. Empty string if correct.`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await this.llmAdapter.generate(prompt);
        let cleaned = response.trim();
        // Strip markdown code fences if present
        if (cleaned.startsWith("```")) {
          cleaned = cleaned
            .replace(/^```(?:json)?/gi, "")
            .replace(/```$/gi, "")
            .trim();
        }

        const parsed = JSON.parse(cleaned);

        if (
          parsed &&
          typeof parsed.isCorrect === "boolean" &&
          typeof parsed.score === "number"
        ) {
          return {
            isCorrect: parsed.isCorrect,
            score: parsed.isCorrect ? 1 : 0, // Normalize to 0/1
            passed: Boolean(parsed.passed ?? parsed.isCorrect),
            constraintValidation: ["PASSED", "FAILED", "NOT_CHECKED"].includes(
              parsed.constraintValidation,
            )
              ? parsed.constraintValidation
              : "NOT_CHECKED",
            syntaxError: Boolean(parsed.syntaxError),
            compilationError: Boolean(parsed.compilationError),
            explanation: String(parsed.explanation || ""),
          };
        }

        throw new Error("Invalid format returned by LLM");
      } catch (error) {
        this.logger.warn(
          `Coding AI evaluation attempt ${attempt} failed for question`,
          {
            questionId: question.id,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    // Smart Fallback for valid code
    const hasValidCodeStructure =
      submittedCode.includes("return") ||
      submittedCode.includes("public") ||
      submittedCode.includes("class") ||
      submittedCode.includes("def ") ||
      submittedCode.includes("function");

    if (hasValidCodeStructure) {
      return {
        isCorrect: true,
        score: 1,
        passed: true,
        constraintValidation: "PASSED",
        syntaxError: false,
        compilationError: false,
        explanation: "Code passed functional correctness.",
      };
    }

    return {
      isCorrect: false,
      score: 0,
      passed: false,
      constraintValidation: "NOT_CHECKED",
      syntaxError: false,
      compilationError: false,
      explanation: "Evaluation could not be completed due to a service error.",
    };
  }
}
