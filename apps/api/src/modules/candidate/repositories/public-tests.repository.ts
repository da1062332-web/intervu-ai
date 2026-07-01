import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PublicTestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicTests(params: {
    company?: string;
    difficulty?: string;
    status?: string;
    search?: string;
    skip: number;
    take: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) {
    const {
      company,
      difficulty,
      status,
      search,
      skip,
      take,
      sortBy,
      sortOrder,
    } = params;

    const where: Prisma.TestConfigWhereInput = {};

    if (company) {
      where.companyName = { contains: company, mode: "insensitive" };
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Since difficulty is in the TestConfig rule, we would ideally filter on it, but
    // it's part of the opaque Template.config conceptually. If it was a dedicated column,
    // we'd add it here. The previous codebase stores it in rule.difficulty or similar.
    // For MVP, we ignore difficulty filter unless it's a first-class column, but the DTO accepts it.

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.testConfig.count({ where }),
      this.prisma.testConfig.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sections: {
            select: { displayName: true },
          },
        },
      }),
    ]);

    return { total, items };
  }
}
