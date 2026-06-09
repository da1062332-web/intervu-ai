import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type {
  Prisma,
  GeneratedQuestion,
  DifficultyLevel,
} from "@prisma/client";

export class GeneratedQuestionRepository {
  private validate(input: any) {
    if (!input)
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
  }

  async create(data: Prisma.GeneratedQuestionUncheckedCreateInput): Promise<GeneratedQuestion> {
    this.validate(data);
    try {
      return await prisma.generatedQuestion.create({ data });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new RepositoryError(
          "DUPLICATE_QUESTION_HASH",
          "A question with this exact hash already exists.",
        );
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByHash(questionHash: string): Promise<GeneratedQuestion | null> {
    this.validate(questionHash);
    try {
      return await prisma.generatedQuestion.findUnique({
        where: { questionHash },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByConcept(conceptKey: string): Promise<GeneratedQuestion[]> {
    this.validate(conceptKey);
    try {
      return await prisma.generatedQuestion.findMany({
        where: { conceptKey },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByDifficulty(
    difficultyLevel: DifficultyLevel,
  ): Promise<GeneratedQuestion[]> {
    this.validate(difficultyLevel);
    try {
      return await prisma.generatedQuestion.findMany({
        where: { difficultyLevel },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async createMany(
    data: Prisma.GeneratedQuestionCreateManyInput[],
  ): Promise<number> {
    this.validate(data);
    try {
      const result = await prisma.generatedQuestion.createMany({
        data,
        skipDuplicates: true, // Gracefully handle duplicate hashes in batch
      });
      return result.count;
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
  async findById(id: string): Promise<GeneratedQuestion | null> {
    this.validate(id);
    try {
      return await prisma.generatedQuestion.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }

  async findByTemplate(templateId: string): Promise<GeneratedQuestion[]> {
    this.validate(templateId);
    try {
      return await prisma.generatedQuestion.findMany({
        where: { templateId },
      });
    } catch (error: any) {
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }

  async delete(id: string): Promise<GeneratedQuestion> {
    this.validate(id);
    try {
      return await prisma.generatedQuestion.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }
}
