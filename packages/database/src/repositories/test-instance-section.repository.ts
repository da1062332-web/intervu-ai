import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, TestInstanceSection } from "@prisma/client";

export class TestInstanceSectionRepository {
  private validate(input: any) {
    if (!input) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
    }
  }

  async createMany(data: Prisma.TestInstanceSectionCreateManyInput[]): Promise<number> {
    this.validate(data);
    try {
      const result = await prisma.testInstanceSection.createMany({
        data,
      });
      return result.count;
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByInstance(testInstanceId: string): Promise<TestInstanceSection[]> {
    this.validate(testInstanceId);
    try {
      return await prisma.testInstanceSection.findMany({
        where: { testInstanceId },
        orderBy: { orderIndex: "asc" },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findById(id: string): Promise<TestInstanceSection | null> {
    this.validate(id);
    try {
      return await prisma.testInstanceSection.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
