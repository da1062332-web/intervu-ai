import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, ExamSection } from "@prisma/client";

export class ExamSectionRepository {
  private validate(input: any) {
    if (!input) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
    }
  }

  async create(
    examConfigId: string,
    data: Prisma.ExamSectionCreateWithoutExamConfigInput,
  ): Promise<ExamSection> {
    this.validate(examConfigId);
    this.validate(data);
    try {
      return await prisma.examSection.create({
        data: {
          examConfigId,
          ...data,
        },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findById(id: string): Promise<ExamSection | null> {
    this.validate(id);
    try {
      return await prisma.examSection.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findManyByConfigId(examConfigId: string): Promise<ExamSection[]> {
    this.validate(examConfigId);
    try {
      return await prisma.examSection.findMany({
        where: { examConfigId },
        orderBy: { displayOrder: "asc" },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByConfigAndOrder(
    examConfigId: string,
    displayOrder: number,
  ): Promise<ExamSection | null> {
    this.validate(examConfigId);
    this.validate(displayOrder);
    try {
      return await prisma.examSection.findFirst({
        where: { examConfigId, displayOrder },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async update(
    id: string,
    data: Prisma.ExamSectionUpdateInput,
  ): Promise<ExamSection> {
    this.validate(id);
    this.validate(data);
    try {
      return await prisma.examSection.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Exam section not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async delete(id: string): Promise<ExamSection> {
    this.validate(id);
    try {
      return await prisma.examSection.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Exam section not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
