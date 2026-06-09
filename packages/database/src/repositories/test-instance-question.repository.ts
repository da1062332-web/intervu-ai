import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, TestInstanceQuestion } from "@prisma/client";

export class TestInstanceQuestionRepository {
  private validate(input: any) {
    if (!input) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
    }
  }

  async createMany(data: Prisma.TestInstanceQuestionCreateManyInput[]): Promise<number> {
    this.validate(data);
    try {
      const result = await prisma.testInstanceQuestion.createMany({
        data,
      });
      return result.count;
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByInstance(testInstanceId: string): Promise<TestInstanceQuestion[]> {
    this.validate(testInstanceId);
    try {
      return await prisma.testInstanceQuestion.findMany({
        where: { testInstanceId },
        orderBy: [{ sectionId: "asc" }, { questionOrder: "asc" }],
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findBySection(sectionId: string): Promise<TestInstanceQuestion[]> {
    this.validate(sectionId);
    try {
      return await prisma.testInstanceQuestion.findMany({
        where: { sectionId },
        orderBy: { questionOrder: "asc" },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async countByInstance(testInstanceId: string): Promise<number> {
    this.validate(testInstanceId);
    try {
      return await prisma.testInstanceQuestion.count({
        where: { testInstanceId },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
