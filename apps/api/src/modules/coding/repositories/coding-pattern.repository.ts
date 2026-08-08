import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ICodingPatternRepository } from "../interfaces/coding-pattern-repository.interface";
import { CodingPattern, CodingPatternStatus, DifficultyLevel, Prisma } from "@prisma/client";

@Injectable()
export class CodingPatternRepository implements ICodingPatternRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CodingPatternCreateInput | Prisma.CodingPatternUncheckedCreateInput): Promise<CodingPattern> {
    return this.prisma.codingPattern.create({ data: data as any });
  }

  async findById(id: string): Promise<CodingPattern | null> {
    return this.prisma.codingPattern.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByPatternKey(patternKey: string): Promise<CodingPattern | null> {
    return this.prisma.codingPattern.findFirst({
      where: {
        patternKey,
        deletedAt: null,
      },
    });
  }

  async findBySlug(slug: string): Promise<CodingPattern | null> {
    return this.prisma.codingPattern.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });
  }

  async findAll(params?: {
    status?: CodingPatternStatus;
    difficulty?: DifficultyLevel;
    oracleKey?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: CodingPattern[]; total: number }> {
    const where: Prisma.CodingPatternWhereInput = {
      deletedAt: null,
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.difficulty ? { difficulty: params.difficulty } : {}),
      ...(params?.oracleKey ? { oracleKey: params.oracleKey } : {}),
      ...(params?.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
              { slug: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.codingPattern.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.codingPattern.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Prisma.CodingPatternUpdateInput | Prisma.CodingPatternUncheckedUpdateInput,
  ): Promise<CodingPattern> {
    return this.prisma.codingPattern.update({
      where: { id },
      data: data as any,
    });
  }

  async softDelete(id: string): Promise<CodingPattern> {
    return this.prisma.codingPattern.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
