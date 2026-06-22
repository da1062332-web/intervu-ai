import { Injectable, Optional } from "@nestjs/common";
import { Topic, Prisma, TopicStatus } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TopicRepository extends BaseRepository<
  Topic & { deletedAt?: Date | null }, // satisfy BaseRepository type constraint
  Prisma.TopicCreateInput,
  Prisma.TopicUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "topic", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TopicRepository(this.prisma, tx) as this;
  }

  async findManyActive(activeOnly = true) {
    return this.prisma.topic.findMany({
      where: {
        ...(activeOnly ? { status: TopicStatus.ACTIVE } : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  async findByCode(code: string) {
    return this.prisma.topic.findUnique({
      where: { code },
    });
  }

  // Override delete to set status: INACTIVE
  override async delete(id: string): Promise<Topic> {
    return this.prisma.topic.update({
      where: { id },
      data: { status: TopicStatus.INACTIVE },
    });
  }
}
