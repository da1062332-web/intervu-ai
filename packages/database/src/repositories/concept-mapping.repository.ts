import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, ConceptMapping } from "@prisma/client";

export class ConceptMappingRepository {
  private validate(input: any) {
    if (!input) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
    }
  }

  async create(
    topicId: string,
    data: Omit<Prisma.ConceptMappingCreateInput, "topicId">,
  ): Promise<ConceptMapping> {
    this.validate(topicId);
    this.validate(data);
    try {
      return await prisma.conceptMapping.create({
        data: {
          topicId,
          ...data,
        },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findById(id: string): Promise<ConceptMapping | null> {
    this.validate(id);
    try {
      return await prisma.conceptMapping.findFirst({
        where: { id, deletedAt: null },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findManyByTopicId(
    topicId: string,
    activeOnly = true,
  ): Promise<ConceptMapping[]> {
    this.validate(topicId);
    try {
      return await prisma.conceptMapping.findMany({
        where: {
          topicId,
          deletedAt: null,
          ...(activeOnly ? { isActive: true } : {}),
        },
        orderBy: { conceptCode: "asc" },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByTopicAndCode(
    topicId: string,
    conceptCode: string,
  ): Promise<ConceptMapping | null> {
    this.validate(topicId);
    this.validate(conceptCode);
    try {
      return await prisma.conceptMapping.findFirst({
        where: { topicId, conceptCode, deletedAt: null },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async update(
    id: string,
    data: Prisma.ConceptMappingUpdateInput,
  ): Promise<ConceptMapping> {
    this.validate(id);
    this.validate(data);
    try {
      return await prisma.conceptMapping.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Concept mapping not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async delete(id: string): Promise<ConceptMapping> {
    this.validate(id);
    try {
      return await prisma.conceptMapping.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Concept mapping not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
