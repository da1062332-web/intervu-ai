import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CodingOracle, Prisma } from "@prisma/client";

export interface FindAllCodingOraclesOptions {
  category?: string;
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
  skip?: number;
  take?: number;
}

@Injectable()
export class CodingOracleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CodingOracleCreateInput): Promise<CodingOracle> {
    return this.prisma.codingOracle.create({ data });
  }

  async upsertByKey(
    key: string,
    data: {
      name: string;
      category?: string;
      description?: string;
      supportedDifficulties?: string[];
      parameterSchema?: any;
    },
  ): Promise<CodingOracle> {
    return this.prisma.codingOracle.upsert({
      where: { key },
      create: {
        key,
        name: data.name,
        category: data.category || "GENERAL",
        description: data.description || "",
        supportedDifficulties: data.supportedDifficulties || [
          "EASY",
          "MEDIUM",
          "HARD",
        ],
        parameterSchema: data.parameterSchema || {},
        isActive: true,
        isSystem: true,
      },
      update: {
        name: data.name,
        category: data.category || "GENERAL",
        description: data.description || "",
        supportedDifficulties: data.supportedDifficulties || [
          "EASY",
          "MEDIUM",
          "HARD",
        ],
      },
    });
  }

  async findById(
    id: string,
  ): Promise<(CodingOracle & { _count?: { patterns: number } }) | null> {
    return this.prisma.codingOracle.findUnique({
      where: { id },
      include: {
        _count: {
          select: { patterns: true },
        },
      },
    });
  }

  async findByKey(
    key: string,
  ): Promise<(CodingOracle & { _count?: { patterns: number } }) | null> {
    return this.prisma.codingOracle.findUnique({
      where: { key },
      include: {
        _count: {
          select: { patterns: true },
        },
      },
    });
  }

  async findAll(options?: FindAllCodingOraclesOptions): Promise<{
    items: (CodingOracle & { _count?: { patterns: number } })[];
    total: number;
  }> {
    const where: Prisma.CodingOracleWhereInput = {
      deletedAt: null,
      ...(options?.category ? { category: options.category } : {}),
      ...(options?.isActive !== undefined
        ? { isActive: options.isActive }
        : {}),
      ...(options?.isSystem !== undefined
        ? { isSystem: options.isSystem }
        : {}),
      ...(options?.search
        ? {
            OR: [
              { key: { contains: options.search, mode: "insensitive" } },
              { name: { contains: options.search, mode: "insensitive" } },
              {
                description: { contains: options.search, mode: "insensitive" },
              },
              { category: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.codingOracle.findMany({
        where,
        include: {
          _count: {
            select: { patterns: true },
          },
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
        skip: options?.skip,
        take: options?.take,
      }),
      this.prisma.codingOracle.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Prisma.CodingOracleUpdateInput,
  ): Promise<CodingOracle> {
    return this.prisma.codingOracle.update({
      where: { id },
      data,
    });
  }

  async toggleStatus(id: string): Promise<CodingOracle> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`CodingOracle with ID "${id}" not found.`);
    }
    return this.prisma.codingOracle.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  async softDelete(id: string): Promise<CodingOracle> {
    return this.prisma.codingOracle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
