import { Injectable } from "@nestjs/common";
import { Template } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all non-soft-deleted templates ordered by creation date descending.
   * Repository layer only — no formatting, no business logic.
   */
  async findAllActiveTemplates(): Promise<Template[]> {
    return this.prisma.template.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
