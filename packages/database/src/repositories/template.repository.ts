import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, Template, DifficultyLevel } from "@prisma/client";

export class TemplateRepository {
  private validate(input: any) {
    if (!input)
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
  }

  async create(data: Prisma.TemplateCreateInput): Promise<Template> {
    this.validate(data);
    try {
      return await prisma.template.create({ data });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new RepositoryError(
          "DUPLICATE_TEMPLATE_KEY",
          "A Template with this key already exists.",
        );
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByConcept(conceptKey: string): Promise<Template[]> {
    this.validate(conceptKey);
    try {
      return await prisma.template.findMany({
        where: { conceptKey, isActive: true },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByDifficulty(
    difficultyLevel: DifficultyLevel,
  ): Promise<Template[]> {
    this.validate(difficultyLevel);
    try {
      return await prisma.template.findMany({
        where: { difficultyLevel, isActive: true },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByConceptAndDifficulty(
    conceptKey: string,
    difficultyLevel: DifficultyLevel,
  ): Promise<Template[]> {
    this.validate(conceptKey);
    this.validate(difficultyLevel);
    try {
      return await prisma.template.findMany({
        where: { conceptKey, difficultyLevel, isActive: true },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async update(
    id: string,
    data: Prisma.TemplateUpdateInput,
  ): Promise<Template> {
    this.validate(id);
    this.validate(data);
    try {
      return await prisma.template.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Template not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
