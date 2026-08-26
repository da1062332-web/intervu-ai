import { Injectable } from "@nestjs/common";
import { AnswerDto } from "@intervu-ai/contracts";

export interface QuestionEvaluationResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  maxMarks: number;
  candidateAnswer: string;
  correctAnswer: string;
  timeSpentSeconds: number;
  // Coding-specific fields (populated only for CODING questions)
  passed?: boolean;
  constraintValidation?: "PASSED" | "FAILED" | "NOT_CHECKED";
  syntaxError?: boolean;
  compilationError?: boolean;
  codingFeedback?: string;
}

@Injectable()
export class ObjectiveEvaluatorService {
  /**
   * Resolves a candidate or expected answer (which might be opt-0, opt-1, A, B, C, D, index, etc.)
   * to its normalized textual representation using the question's options list.
   */
  resolveToText(value: string, options?: any[]): string {
    const clean = (value ?? "").trim();
    if (!clean) return "";

    // 1. Check if it's opt-0, opt-1, opt-2...
    const optMatch = clean.match(/^opt-(\d+)$/i);
    if (optMatch && options && options.length > 0) {
      const idx = parseInt(optMatch[1], 10);
      if (idx >= 0 && idx < options.length) {
        const raw = options[idx];
        const text =
          typeof raw === "object" && raw !== null
            ? raw.text || raw.value || raw.label || raw.optionText || ""
            : String(raw);
        if (text) return text.trim().toLowerCase();
      }
    }

    // 2. Check if it's a single letter A, B, C, D... or Option A, Option B...
    const letterMatch = clean.match(/^(?:option\s+)?([a-z])$/i);
    if (letterMatch && options && options.length > 0) {
      const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) {
        const raw = options[idx];
        const text =
          typeof raw === "object" && raw !== null
            ? raw.text || raw.value || raw.label || raw.optionText || ""
            : String(raw);
        if (text) return text.trim().toLowerCase();
      }
    }

    // 3. If it's an object with text/value
    if (typeof value === "object" && value !== null) {
      const raw = value as any;
      const text = raw.text || raw.value || raw.label || "";
      if (text) return String(text).trim().toLowerCase();
    }

    return clean.toLowerCase();
  }

  /**
   * Evaluates individual candidate answers against correct answers.
   * Scoring: 1 mark for correct, 0 for incorrect or skipped. No negative marking.
   */
  evaluateAnswers(
    answers: AnswerDto[],
    questions: Array<{
      id: string;
      answer: string;
      questionType: string;
      options?: any[];
      metadata?: Record<string, unknown>;
    }>,
  ): QuestionEvaluationResult[] {
    const results: QuestionEvaluationResult[] = [];
    const answersMap = new Map(answers.map((a) => [a.questionId, a]));

    for (const question of questions) {
      const candidateAnsObj = answersMap.get(question.id);

      let candidateAnswer = "";
      let timeSpentSeconds = 0;

      if (candidateAnsObj) {
        timeSpentSeconds = candidateAnsObj.timeSpentSeconds || 0;
        if (
          candidateAnsObj.selectedOptionIds &&
          candidateAnsObj.selectedOptionIds.length > 0
        ) {
          candidateAnswer = JSON.stringify(candidateAnsObj.selectedOptionIds);
        } else if (candidateAnsObj.selectedOptionId) {
          candidateAnswer = candidateAnsObj.selectedOptionId;
        } else if (candidateAnsObj.textResponse) {
          candidateAnswer = candidateAnsObj.textResponse;
        }
      }

      const correctAnswer = question.answer || "";
      const type = (question.questionType || "MCQ").toLowerCase();

      const isCorrect = this.compareAnswers(
        candidateAnswer,
        correctAnswer,
        type,
        question.options,
      );

      // No negative marking — score is always 0 or 1
      const score = isCorrect ? 1 : 0;
      const maxMarks = 1;

      results.push({
        questionId: question.id,
        isCorrect,
        score,
        maxMarks,
        candidateAnswer,
        correctAnswer,
        timeSpentSeconds,
      });
    }

    return results;
  }

  /**
   * Compares candidate answer with correct answer based on question type and options.
   */
  compareAnswers(
    candidate: string,
    expected: string,
    type: string,
    options?: any[],
  ): boolean {
    const cleanCand = (candidate ?? "").trim().toLowerCase();
    const cleanExpected = (expected ?? "").trim().toLowerCase();

    if (!cleanCand) {
      return false;
    }

    // 1. Direct literal equality
    if (cleanCand === cleanExpected) {
      return true;
    }

    if (type === "msq") {
      const parseToArray = (val: string): string[] => {
        if (val.startsWith("[") && val.endsWith("]")) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              return parsed.map((item) =>
                this.resolveToText(String(item), options),
              );
            }
          } catch {
            // ignore JSON parse error, fallback to split
          }
        }
        return val
          .split(",")
          .map((item) => this.resolveToText(item.trim(), options))
          .filter((item) => item.length > 0);
      };

      const candList = parseToArray(cleanCand).sort();
      const expList = parseToArray(cleanExpected).sort();

      if (candList.length !== expList.length) {
        return false;
      }
      return candList.every((val, idx) => val === expList[idx]);
    }

    if (type === "numeric") {
      const candNum = parseFloat(cleanCand);
      const expNum = parseFloat(cleanExpected);
      if (isNaN(candNum) || isNaN(expNum)) {
        return false;
      }
      return Math.abs(candNum - expNum) < 0.0001;
    }

    // 2. Resolve both candidate and expected to normalized text
    const resolvedCand = this.resolveToText(cleanCand, options);
    const resolvedExpected = this.resolveToText(cleanExpected, options);

    if (
      resolvedCand === resolvedExpected ||
      resolvedCand === cleanExpected ||
      cleanCand === resolvedExpected
    ) {
      return true;
    }

    // 3. Numeric string comparison (e.g., "18" vs "18.00")
    const candNum = parseFloat(resolvedCand);
    const expNum = parseFloat(resolvedExpected);
    if (
      !isNaN(candNum) &&
      !isNaN(expNum) &&
      Math.abs(candNum - expNum) < 0.0001
    ) {
      return true;
    }

    return false;
  }
}
