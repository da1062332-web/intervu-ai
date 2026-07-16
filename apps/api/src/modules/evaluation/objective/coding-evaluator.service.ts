import { Injectable, Inject, Logger } from "@nestjs/common";
import { AnswerDto } from "@intervu-ai/contracts";
import { QuestionEvaluationResult } from "./objective-evaluator.service";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";

@Injectable()
export class CodingEvaluatorService {
  private readonly logger = new Logger("CodingEvaluatorService");

  constructor(
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
  ) {}

  /**
   * Evaluates coding candidate answers using the LLM.
   */
  async evaluateAnswers(
    answers: AnswerDto[],
    questions: Array<{
      id: string;
      answer: string; // Expected logic / test cases
      questionType: string;
      topicName: string;
      difficulty: string;
    }>,
  ): Promise<QuestionEvaluationResult[]> {
    const results: QuestionEvaluationResult[] = [];
    const answersMap = new Map(answers.map((a) => [a.questionId, a]));

    for (const question of questions) {
      const candidateAnsObj = answersMap.get(question.id);
      
      let candidateAnswer = "";
      let timeSpentSeconds = 0;

      if (candidateAnsObj) {
        timeSpentSeconds = candidateAnsObj.timeSpentSeconds || 0;
        candidateAnswer = candidateAnsObj.textResponse || "";
      }

      const expectedAnswer = question.answer || "";
      
      // Attempt to score via LLM
      const result = await this.evaluateWithLLM(
        question.id,
        candidateAnswer,
        expectedAnswer,
        question.topicName,
        question.difficulty
      );

      results.push({
        questionId: question.id,
        isCorrect: result.isCorrect,
        score: result.score,
        maxMarks: 1, // Default to 1 mark, can be updated later
        candidateAnswer,
        correctAnswer: expectedAnswer,
        timeSpentSeconds,
      });
    }

    return results;
  }

  private async evaluateWithLLM(
    questionId: string,
    candidateAnswer: string,
    expectedAnswer: string,
    topicName: string,
    difficulty: string
  ): Promise<{ score: number; isCorrect: boolean }> {
    if (!candidateAnswer || candidateAnswer.trim() === "") {
      return { score: 0, isCorrect: false };
    }

    // candidateAnswer should be a JSON string from OneCompiler { language, files, result: { output, ... } }
    let parsedCandidate = "";
    try {
      const parsed = JSON.parse(candidateAnswer);
      parsedCandidate = `Language: ${parsed.language || 'Unknown'}\nCode:\n${parsed.files?.[0]?.content || 'None'}\nOutput:\n${parsed.result?.output || 'None'}`;
    } catch {
      parsedCandidate = candidateAnswer; // Fallback to raw string if not JSON
    }

    const prompt = `
You are a strict technical interviewer evaluating a candidate's coding solution for a ${difficulty} level question in ${topicName}.

### Problem/Expected Solution context:
${expectedAnswer || 'Provide a general evaluation based on correct algorithmic logic.'}

### Candidate's Submitted Code & Output:
${parsedCandidate}

Evaluate the candidate's code logic and actual execution output.
Determine a score from 0.0 to 1.0 based on correctness, logic, and efficiency.
If the code is entirely correct and the output matches the expected logic, the score should be 1.0.
If it partially works or has minor logic errors, assign a partial score (e.g. 0.5).
If it completely fails, assign 0.0.

Respond ONLY with a valid JSON object in the following format:
{
  "score": 1.0,
  "isCorrect": true,
  "feedback": "string explaining the reasoning briefly"
}
Ensure the output is ONLY valid JSON. Do not include markdown tags like \`\`\`json.
`;

    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.llmAdapter.generate(prompt);
        let cleaned = response.trim();
        if (cleaned.startsWith("\`\`\`")) {
          cleaned = cleaned
            .replace(/^\`\`\`(?:json)?/gi, "")
            .replace(/\`\`\`$/gi, "")
            .trim();
        }
        
        const parsedResponse = JSON.parse(cleaned);
        
        if (
          parsedResponse &&
          typeof parsedResponse.score === "number" &&
          typeof parsedResponse.isCorrect === "boolean"
        ) {
          return {
            score: parsedResponse.score,
            isCorrect: parsedResponse.isCorrect,
          };
        }
        
        throw new Error("Invalid format returned by LLM");
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `LLM coding evaluation failed on attempt ${attempt}. Retrying...`,
          {
            questionId,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    this.logger.warn(
      "LLM coding evaluation completely failed. Falling back to 0 score.",
      {
        questionId,
        error: lastError instanceof Error ? lastError.message : String(lastError),
      },
    );

    return { score: 0, isCorrect: false };
  }
}
