import { Injectable, Optional } from "@nestjs/common";
import { Topic, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TopicRepository extends BaseRepository<
  Topic,
  Prisma.TopicCreateInput,
  Prisma.TopicUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "topic", { softDelete: true }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TopicRepository(this.prisma, tx) as this;
  }

  async findManyActive(activeOnly = true) {
    return this.prisma.topic.findMany({
      where: {
        deletedAt: null,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { topicName: "asc" },
    });
  }

  // Override delete to set both isActive: false and deletedAt: Date
  override async delete(id: string): Promise<Topic> {
    return this.prisma.topic.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
