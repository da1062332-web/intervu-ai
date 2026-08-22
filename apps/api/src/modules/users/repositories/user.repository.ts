import { Injectable, Optional } from "@nestjs/common";
import { User, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "user", { softDelete: true }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new UserRepository(this.prisma, tx) as this;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (user && this.options.softDelete && user.deletedAt !== null) {
      return null;
    }
    return user;
  }

  async findRawByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { googleId },
    });
    if (user && this.options.softDelete && user.deletedAt !== null) {
      return null;
    }
    return user;
  }

  async findRawByGoogleId(googleId: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { googleId },
    });
  }

  async findCandidatesWithSummary(params: {
    where: Prisma.UserWhereInput;
    skip?: number;
    take?: number;
    orderBy: any;
  }) {
    const { where, skip, take, orderBy } = params;
    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          performanceSummary: true,
          _count: {
            select: {
              enrollments: true,
              testInstances: true,
            },
          },
        },
      }),
      this.db.user.count({ where }),
    ]);
    return { items, total };
  }

  async getCandidateStatusCounts(
    baseWhere?: Prisma.UserWhereInput,
  ): Promise<{ total: number; active: number; inactive: number }> {
    const whereWithoutStatus = { ...baseWhere, role: "CANDIDATE" as const };
    delete (whereWithoutStatus as any).deletedAt;

    const [active, inactive] = await Promise.all([
      this.db.user.count({ where: { ...whereWithoutStatus, deletedAt: null } }),
      this.db.user.count({
        where: { ...whereWithoutStatus, deletedAt: { not: null } },
      }),
    ]);
    return { total: active + inactive, active, inactive };
  }
}
