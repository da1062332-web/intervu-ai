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

    // 0. If it's a JSON string, extract first
    const extracted = this.extractFromJsonAnswer(clean);
    const target = (extracted || clean).trim();

    // 1. Direct ID/value match in options (e.g. opt.id === "opt-1" or opt.value === "opt-1")
    if (options && options.length > 0) {
      for (const opt of options) {
        if (typeof opt === "object" && opt !== null) {
          const optId = String(opt.id || opt.value || "").trim().toLowerCase();
          if (optId && optId === target.toLowerCase()) {
            const text = opt.text || opt.label || opt.optionText || "";
            if (text) return String(text).trim().toLowerCase();
          }
        }
      }
    }

    // 2. Check if it's opt-0, opt-1, opt-2...
    const optMatch = target.match(/^opt-(\d+)$/i);
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

    // 3. Check if it's a numeric index: 0, 1, 2...
    const numMatch = target.match(/^(\d+)$/);
    if (numMatch && options && options.length > 0) {
      const idx = parseInt(numMatch[1], 10);
      if (idx >= 0 && idx < options.length) {
        const raw = options[idx];
        const text =
          typeof raw === "object" && raw !== null
            ? raw.text || raw.value || raw.label || raw.optionText || ""
            : String(raw);
        if (text) return text.trim().toLowerCase();
      }
    }

    // 4. Check if it's a single letter A, B, C, D... or Option A, Option B...
    const letterMatch = target.match(/^(?:option\s+)?([a-z])$/i);
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

    // 5. If it's an object with text/value
    if (typeof value === "object" && value !== null) {
      const raw = value as any;
      const text = raw.text || raw.value || raw.label || "";
      if (text) return String(text).trim().toLowerCase();
    }

    return target.toLowerCase();
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
   * Extracts a clean option ID or text from a candidate answer that
   * may have been saved as a JSON object (e.g., '{"selectedOptionId":"opt-1"}').
   */
  private extractFromJsonAnswer(raw: string): string {
    const trimmed = (raw ?? "").trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "object" && parsed !== null) {
          for (const [k, v] of Object.entries(parsed)) {
            const kLower = k.toLowerCase();
            if (
              kLower === "selectedoptionid" ||
              kLower === "answer" ||
              kLower === "textresponse" ||
              kLower === "value"
            ) {
              if (typeof v === "string" || typeof v === "number") {
                return String(v).trim();
              }
            }
          }
        }
      } catch {
        // not valid JSON — return as-is
      }
    }
    return "";
  }

  /**
   * Resolves an option index (opt-0, opt-1, A, B, 0, 1) to the actual
   * index number. Returns -1 if not an index-like value.
   */
  private resolveToIndex(value: string, options?: any[]): number {
    const clean = (value ?? "").trim();
    if (!clean || !options || options.length === 0) return -1;

    // Check if clean matches opt.id or opt.value directly
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (typeof opt === "object" && opt !== null) {
        const optId = String(opt.id || opt.value || "").trim().toLowerCase();
        if (optId && optId === clean.toLowerCase()) {
          return i;
        }
      }
    }

    // opt-N format
    const optMatch = clean.match(/^opt-(\d+)$/i);
    if (optMatch) return parseInt(optMatch[1], 10);

    // Letter A-Z or "Option A"
    const letterMatch = clean.match(/^(?:option\s+)?([a-z])$/i);
    if (letterMatch) {
      const letter = letterMatch[1].toLowerCase();
      const letterIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;

      // Ensure the letter is not itself the literal text/value of an option (e.g. Option text is "A")
      const isLiteralOptionText = options.some((opt) => {
        const optText =
          typeof opt === "object" && opt !== null
            ? String(opt.text || opt.label || opt.value || "").trim().toLowerCase()
            : String(opt).trim().toLowerCase();
        return optText === letter;
      });

      if (!isLiteralOptionText && letterIdx >= 0 && letterIdx < options.length) {
        return letterIdx;
      }
    }

    // Pure numeric index
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 0 && num < options.length && String(num) === clean) {
      return num;
    }

    return -1;
  }

  compareAnswers(
    candidate: string,
    expected: string,
    type: string,
    options?: any[],
  ): boolean {
    // 0. Extract from JSON-wrapped answers before lowercasing
    const extractedCand = this.extractFromJsonAnswer(candidate) || candidate;
    const extractedExp = this.extractFromJsonAnswer(expected) || expected;

    const cleanCand = (extractedCand ?? "").trim().toLowerCase();
    const cleanExpected = (extractedExp ?? "").trim().toLowerCase();

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
      const isNumericPattern = (s: string) => /^-?\d+(?:\.\d+)?$/.test(s.trim());
      if (isNumericPattern(cleanCand) && isNumericPattern(cleanExpected)) {
        const candNum = Number(cleanCand);
        const expNum = Number(cleanExpected);
        return !isNaN(candNum) && !isNaN(expNum) && Math.abs(candNum - expNum) < 0.0001;
      }
      return false;
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

    // 3. Index-based matching: resolve both to option indices and compare
    if (options && options.length > 0) {
      const candIdx = this.resolveToIndex(cleanCand, options);
      const expIdx = this.resolveToIndex(cleanExpected, options);
      if (candIdx >= 0 && expIdx >= 0 && candIdx === expIdx) {
        return true;
      }
    }

    // 4. Strict numeric string comparison (e.g., "18" vs "18.00")
    // Only apply when both strings are purely numeric to prevent false-positives
    // on unit mismatches like "20 km" vs "20 miles" or "2 hours" vs "2 days"
    const isStrictNumeric = (s: string): boolean =>
      /^-?\d+(?:\.\d+)?$/.test(s.trim());

    if (isStrictNumeric(resolvedCand) && isStrictNumeric(resolvedExpected)) {
      const candNum = Number(resolvedCand);
      const expNum = Number(resolvedExpected);
      if (
        !isNaN(candNum) &&
        !isNaN(expNum) &&
        Math.abs(candNum - expNum) < 0.0001
      ) {
        return true;
      }
    }

    return false;
  }
}
