import { Injectable, Optional } from "@nestjs/common";
import { ConceptMapping, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ConceptMappingRepository extends BaseRepository<
  ConceptMapping,
  Prisma.ConceptMappingCreateInput,
  Prisma.ConceptMappingUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "conceptMapping", { softDelete: true }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new ConceptMappingRepository(this.prisma, tx) as this;
  }

  async findByTopicAndCode(topicId: string, conceptCode: string) {
    return this.prisma.conceptMapping.findFirst({
      where: {
        topicId,
        conceptCode,
        deletedAt: null,
      },
    });
  }

  async findManyByTopicId(topicId: string, activeOnly = true) {
    return this.prisma.conceptMapping.findMany({
      where: {
        topicId,
        deletedAt: null,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { conceptCode: "asc" },
    });
  }

  // Override delete to set both isActive: false and deletedAt: Date
  override async delete(id: string): Promise<ConceptMapping> {
    return this.prisma.conceptMapping.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
