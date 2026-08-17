import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { UserRole } from "@prisma/client";

export interface CodingContext {
  testInstanceQuestion: any;
  question: any;
  codingData: any;
  questionText: string;
}

@Injectable()
export class CodingContextResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the exact coding context (Question, TestInstanceQuestion, and CodingData)
   * while rigorously verifying candidate ownership, question type, and preventing data leakage.
   */
  async resolveContext(
    questionId: string,
    testInstanceId: string | undefined,
    user: AuthUser,
  ): Promise<CodingContext> {
    if (!questionId) {
      throw new BadRequestException("Question ID is required.");
    }

    const isDemo =
      !testInstanceId ||
      testInstanceId.startsWith("demo") ||
      testInstanceId.includes("sandbox") ||
      testInstanceId.includes("mock") ||
      testInstanceId.includes("sample");

    // 1. If it's a test instance, verify ownership and get snapshot
    if (!isDemo && testInstanceId) {
      const instance = await this.prisma.testInstance.findUnique({
        where: { id: testInstanceId },
        select: { id: true, userId: true, questions: true },
      });

      if (!instance) {
        throw new NotFoundException(
          `Assessment session ${testInstanceId} not found.`,
        );
      }

      if (user.role !== UserRole.ADMIN && instance.userId !== user.id) {
        throw new ForbiddenException(
          "You do not have permission to execute code for this assessment session.",
        );
      }

      // 2. Fetch TestInstanceQuestion securely ensuring both testInstanceId and questionId match
      const questionsSnapshot = (instance.questions as any[]) || [];
      const testInstanceQuestion = questionsSnapshot.find(
        (q: any) =>
          q.questionId === questionId ||
          q.questionSnapshot?.id === questionId ||
          q.id === questionId,
      );

      if (!testInstanceQuestion) {
        throw new BadRequestException(
          `Question ${questionId} does not belong to test instance ${testInstanceId}.`,
        );
      }

      const snapshot =
        testInstanceQuestion.questionSnapshot || testInstanceQuestion;

      const codingData = this.extractOrSynthesizeCodingData(snapshot);
      if (!codingData) {
        throw new BadRequestException(
          `Question ${questionId} is missing coding test data.`,
        );
      }

      const questionType = snapshot.questionType || snapshot.type;
      if (questionType && questionType !== "CODING") {
        throw new BadRequestException(
          `Question ${questionId} is not a CODING question.`,
        );
      }

      const questionText =
        snapshot.questionText || snapshot.questionStatement || "";

      return {
        testInstanceQuestion,
        question: snapshot,
        codingData,
        questionText,
      };
    }

    // 3. Fallback for Demo/Sandbox: Fetch directly from Question or GeneratedQuestion
    let question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    let codingData: any = question
      ? this.extractOrSynthesizeCodingData(question)
      : null;
    let questionText =
      question?.questionText || (question as any)?.questionStatement || "";
    let questionType = (question as any)?.questionType;

    if (!question && this.prisma.generatedQuestion) {
      const genQ = await this.prisma.generatedQuestion.findUnique({
        where: { id: questionId },
      });
      if (genQ) {
        codingData = this.extractOrSynthesizeCodingData(genQ);
        questionText = genQ.questionText || "";
        questionType = genQ.questionType;
        question = { id: genQ.id, questionText, codingData } as any;
      }
    }

    if (!question) {
      throw new NotFoundException(`Question ${questionId} not found.`);
    }

    if (questionType && questionType !== "CODING") {
      throw new BadRequestException(
        `Question ${questionId} is not a CODING question.`,
      );
    }

    if (!codingData) {
      throw new BadRequestException(
        `Question ${questionId} is missing coding test data.`,
      );
    }

    return {
      testInstanceQuestion: null,
      question,
      codingData,
      questionText,
    };
  }

  private extractOrSynthesizeCodingData(snapshot: any): any {
    let codingData =
      snapshot.codingData || (snapshot.metadata as any)?.codingData;
    if (
      codingData &&
      (Array.isArray(codingData.publicTests) || codingData.oracleKey)
    ) {
      return codingData;
    }

    // Attempt fallback from instructions or testCases in metadata for legacy questions
    try {
      let rawInstructions = snapshot.instructions;
      if (typeof rawInstructions === "string") {
        try {
          rawInstructions = JSON.parse(rawInstructions);
        } catch {}
      }

      let testCases =
        rawInstructions?.testCases || snapshot.metadata?.testCases || [];
      if (typeof testCases === "string") {
        try {
          testCases = JSON.parse(testCases);
        } catch {}
      }

      if (Array.isArray(testCases) && testCases.length > 0) {
        const publicTests = testCases.slice(0, 2).map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.output ||
            tc.expectedOutput || { result: tc.output },
          isPublic: true,
          explanation: "Public sample test case.",
        }));
        const hiddenTests = testCases.slice(2).map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.output ||
            tc.expectedOutput || { result: tc.output },
          isPublic: false,
          explanation: "Hidden test case.",
        }));

        return {
          publicTests:
            publicTests.length > 0
              ? publicTests
              : [{ input: "0", expectedOutput: "0" }],
          hiddenTests,
          stressTests: [],
          boundaryTests: [],
          starterCode: snapshot.starterCode || {},
        };
      }
    } catch {}

    return null;
  }
}
