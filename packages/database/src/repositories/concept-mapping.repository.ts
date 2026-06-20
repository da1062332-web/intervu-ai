import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, Concept } from "@prisma/client";
import { ConceptStatus } from "@prisma/client";

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
    data: Omit<Prisma.ConceptUncheckedCreateInput, "topicId">,
  ): Promise<Concept> {
    this.validate(topicId);
    this.validate(data);
    try {
      return await prisma.concept.create({
        data: {
          topicId,
          ...data,
        },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findById(id: string): Promise<Concept | null> {
    this.validate(id);
    try {
      return await prisma.concept.findFirst({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findManyByTopicId(
    topicId: string,
    activeOnly = true,
  ): Promise<Concept[]> {
    this.validate(topicId);
    try {
      return await prisma.concept.findMany({
        where: {
          topicId,
          ...(activeOnly ? { status: ConceptStatus.ACTIVE } : {}),
        },
        orderBy: { code: "asc" },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByTopicAndCode(
    topicId: string,
    code: string,
  ): Promise<Concept | null> {
    this.validate(topicId);
    this.validate(code);
    try {
      return await prisma.concept.findFirst({
        where: { topicId, code },
      });
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async update(
    id: string,
    data: Prisma.ConceptUpdateInput,
  ): Promise<Concept> {
    this.validate(id);
    this.validate(data);
    try {
      return await prisma.concept.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Concept not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async delete(id: string): Promise<Concept> {
    this.validate(id);
    try {
      return await prisma.concept.update({
        where: { id },
        data: { status: ConceptStatus.INACTIVE },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "Concept not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }
}
