import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository<
  T extends { id: string; deletedAt?: Date | null },
  CreateInput,
  UpdateInput,
> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: keyof Omit<
      PrismaService,
      | '$connect'
      | '$disconnect'
      | '$on'
      | '$transaction'
      | '$use'
      | '$extends'
      | 'onModuleDestroy'
    >,
    protected readonly options: { softDelete?: boolean } = { softDelete: false },
    protected readonly tx?: Prisma.TransactionClient,
  ) {}

  protected get db(): Prisma.TransactionClient {
    return this.tx ?? this.prisma;
  }

  protected get model() {
    return (this.db as Record<string, unknown>)[this.modelName as string] as {
      findUnique(args: { where: { id: string; deletedAt?: null } }): Promise<T | null>;
      findMany(args?: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, unknown> | Record<string, unknown>[];
        take?: number;
        skip?: number;
      }): Promise<T[]>;
      create(args: { data: CreateInput }): Promise<T>;
      update(args: { where: { id: string; deletedAt?: null }; data: UpdateInput }): Promise<T>;
      delete(args: { where: { id: string } }): Promise<T>;
      count(args?: { where?: Record<string, unknown> }): Promise<number>;
    };
  }

  async findById(id: string): Promise<T | null> {
    const where: Record<string, unknown> = { id };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.model.findUnique({ where: where as { id: string; deletedAt?: null } });
  }

  async findAll(whereClause?: Record<string, unknown>): Promise<T[]> {
    const where: Record<string, unknown> = { ...whereClause };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.model.findMany({ where });
  }

  async create(data: CreateInput): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    const where: Record<string, unknown> = { id };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.model.update({
      where: where as { id: string; deletedAt?: null },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    if (this.options.softDelete) {
      const where: Record<string, unknown> = { id, deletedAt: null };
      return this.model.update({
        where: where as { id: string; deletedAt?: null },
        data: { deletedAt: new Date() } as unknown as UpdateInput,
      });
    }
    return this.model.delete({ where: { id } });
  }

  async count(whereClause?: Record<string, unknown>): Promise<number> {
    const where: Record<string, unknown> = { ...whereClause };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.model.count({ where });
  }

  async findPaginated(
    paginationOptions: { page?: number; limit?: number } = {},
    whereClause?: Record<string, unknown>,
    orderByClause?: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<{ items: T[]; total: number; page: number; limit: number }> {
    const page = paginationOptions.page && paginationOptions.page > 0 ? Math.floor(paginationOptions.page) : 1;
    const limit = paginationOptions.limit && paginationOptions.limit > 0 ? Math.floor(paginationOptions.limit) : 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { ...whereClause };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: orderByClause,
        take: limit,
        skip,
      }),
      this.model.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  abstract withTransaction(tx: Prisma.TransactionClient): this;
}
