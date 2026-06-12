import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type {
  Prisma,
  TestInstance,
  TestInstanceSection,
  TestInstanceQuestion,
} from "@prisma/client";

import { createId } from "@paralleldrive/cuid2";

export type FullAssemblyData = TestInstance & {
  sections: (TestInstanceSection & {
    questions: TestInstanceQuestion[];
  })[];
};

export class AssemblyRepository {
  private validate(input: any) {
    if (!input) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
    }
  }

  /**
   * Persists the entire assembled test instance inside a Prisma transaction.
   * If any step fails, the entire transaction is rolled back.
   * Uses a flat array transaction for maximum remote db performance.
   */
  async persistAssembly(
    instanceData: Prisma.TestInstanceUncheckedCreateInput,
    sectionsData: Omit<
      Prisma.TestInstanceSectionUncheckedCreateInput,
      "testInstanceId"
    >[],
    questionsDataMap: Record<
      string,
      Omit<
        Prisma.TestInstanceQuestionUncheckedCreateInput,
        "testInstanceId" | "sectionId"
      >[]
    >, // key is sectionKey
  ): Promise<TestInstance> {
    this.validate(instanceData);
    this.validate(sectionsData);

    const instanceId = instanceData.id || createId();
    const queries: any[] = [];

    // 1. Top-level TestInstance query
    queries.push(
      prisma.testInstance.create({
        data: {
          ...instanceData,
          id: instanceId,
        },
      }),
    );

    // 2. Sections and their questions
    for (const sectionInput of sectionsData) {
      const sectionId = sectionInput.id || createId();

      queries.push(
        prisma.testInstanceSection.create({
          data: {
            ...sectionInput,
            id: sectionId,
            testInstanceId: instanceId,
          },
        }),
      );

      const questionsForSection =
        questionsDataMap[sectionInput.sectionKey] || [];
      if (questionsForSection.length > 0) {
        const finalQuestions = questionsForSection.map((q) => ({
          ...q,
          id: q.id || createId(),
          testInstanceId: instanceId,
          sectionId: sectionId,
        }));

        queries.push(
          prisma.testInstanceQuestion.createMany({
            data: finalQuestions,
          }),
        );
      }
    }

    try {
      // Execute flat array transaction (one network roundtrip)
      const results = await prisma.$transaction(queries);
      return results[0] as TestInstance;
    } catch (error: any) {
      throw new RepositoryError(
        "DB_ERROR",
        `Failed to persist assembly: ${error.message}`,
      );
    }
  }
  /**
   * Assembly Read Model
   * Fetches the complete structure in a single highly optimized join query.
   */
  async getAssemblyData(
    testInstanceId: string,
  ): Promise<FullAssemblyData | null> {
    this.validate(testInstanceId);
    try {
      return await prisma.testInstance.findUnique({
        where: { id: testInstanceId },
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questions: {
                orderBy: { questionOrder: "asc" },
              },
            },
          },
        },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
