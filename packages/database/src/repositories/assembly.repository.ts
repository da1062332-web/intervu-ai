import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, TestInstance, TestInstanceSection, TestInstanceQuestion } from "@prisma/client";

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
   */
  async persistAssembly(
    instanceData: Prisma.TestInstanceUncheckedCreateInput,
    sectionsData: Omit<Prisma.TestInstanceSectionUncheckedCreateInput, "testInstanceId">[],
    questionsDataMap: Record<string, Omit<Prisma.TestInstanceQuestionUncheckedCreateInput, "testInstanceId" | "sectionId">[]> // key is sectionKey
  ): Promise<TestInstance> {
    this.validate(instanceData);
    this.validate(sectionsData);

    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Create the Instance
        const instance = await tx.testInstance.create({
          data: instanceData,
        });

        // 2. Concurrently create Sections and their Questions
        await Promise.all(
          sectionsData.map(async (sectionInput) => {
            const section = await tx.testInstanceSection.create({
              data: {
                ...sectionInput,
                testInstanceId: instance.id,
              },
            });

            const questionsForSection = questionsDataMap[section.sectionKey] || [];
            if (questionsForSection.length > 0) {
              const finalQuestions = questionsForSection.map((q) => ({
                ...q,
                testInstanceId: instance.id,
                sectionId: section.id,
              }));

              await tx.testInstanceQuestion.createMany({
                data: finalQuestions,
              });
            }
          })
        );

        return instance;
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", `Failed to persist assembly: ${error.message}`);
    }
  }

  /**
   * Assembly Read Model
   * Fetches the complete structure in a single highly optimized join query.
   */
  async getAssemblyData(testInstanceId: string): Promise<FullAssemblyData | null> {
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
