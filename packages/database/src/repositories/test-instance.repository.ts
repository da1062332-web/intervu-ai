import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, TestInstance, TestInstanceStatus } from "@prisma/client";

export class TestInstanceRepository {
  private validate(input: any) {
    if (!input) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
    }
  }

  async create(data: Prisma.TestInstanceUncheckedCreateInput): Promise<TestInstance> {
    this.validate(data);
    try {
      return await prisma.testInstance.create({ data });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findById(id: string): Promise<TestInstance | null> {
    this.validate(id);
    try {
      return await prisma.testInstance.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findActiveByUser(userId: string): Promise<TestInstance[]> {
    this.validate(userId);
    try {
      return await prisma.testInstance.findMany({
        where: {
          userId,
          status: { in: ["CREATED", "IN_PROGRESS"] },
        },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async updateStatus(id: string, status: TestInstanceStatus): Promise<TestInstance> {
    this.validate(id);
    this.validate(status);
    try {
      return await prisma.testInstance.update({
        where: { id },
        data: { status },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Test instance not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async markSubmitted(id: string): Promise<TestInstance> {
    this.validate(id);
    try {
      return await prisma.testInstance.update({
        where: { id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Test instance not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async markCompleted(id: string): Promise<TestInstance> {
    this.validate(id);
    try {
      return await prisma.testInstance.update({
        where: { id },
        data: {
          status: "COMPLETED",
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Test instance not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
