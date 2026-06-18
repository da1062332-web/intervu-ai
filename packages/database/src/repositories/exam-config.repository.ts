import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, ExamConfig } from "@prisma/client";

export class ExamConfigRepository {
  private validate(input: any) {
    if (!input) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
    }
  }

  async create(data: Prisma.ExamConfigCreateInput): Promise<ExamConfig> {
    this.validate(data);
    try {
      return await prisma.examConfig.create({ data });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findById(id: string): Promise<ExamConfig | null> {
    this.validate(id);
    try {
      return await prisma.examConfig.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findAllActive(): Promise<ExamConfig[]> {
    try {
      return await prisma.examConfig.findMany({
        where: { isActive: true, isArchived: false },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByCode(code: string): Promise<ExamConfig | null> {
    this.validate(code);
    try {
      return await prisma.examConfig.findUnique({
        where: { code },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async update(
    id: string,
    data: Prisma.ExamConfigUpdateInput,
  ): Promise<ExamConfig> {
    this.validate(id);
    this.validate(data);
    try {
      return await prisma.examConfig.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Exam config not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
