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
   * Evaluates individual candidate answers against correct answers.
   * Scoring: 1 mark for correct, 0 for incorrect or skipped. No negative marking.
   */
  evaluateAnswers(
    answers: AnswerDto[],
    questions: Array<{
      id: string;
      answer: string;
      questionType: string;
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
   * Compares candidate answer with correct answer based on question type.
   */
  compareAnswers(candidate: string, expected: string, type: string): boolean {
    const cleanCand = (candidate ?? "").trim().toLowerCase();
    const cleanExpected = (expected ?? "").trim().toLowerCase();

    if (!cleanCand) {
      return false;
    }

    if (type === "msq") {
      const parseToArray = (val: string): string[] => {
        if (val.startsWith("[") && val.endsWith("]")) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              return parsed.map((item) => String(item).trim().toLowerCase());
            }
          } catch {
            // ignore JSON parse error, fallback to split
          }
        }
        return val
          .split(",")
          .map((item) => item.trim().toLowerCase())
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

    // Default: MCQ, True/False, Fill in the Blank (case-insensitive string comparison)
    return cleanCand === cleanExpected;
  }
}
