import { Injectable, Optional } from "@nestjs/common";
import { Blueprint, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class BlueprintRepository extends BaseRepository<
  Blueprint,
  Prisma.BlueprintCreateInput,
  Prisma.BlueprintUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "blueprint", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new BlueprintRepository(this.prisma, tx) as this;
  }

  async findByConfigId(configId: string) {
    return this.prisma.blueprint.findUnique({
      where: { configId },
      include: {
        examConfig: {
          include: { sections: true },
        },
        styleProfile: {
          include: { characteristics: true },
        },
      },
    });
  }

  async findByIdWithRelations(id: string) {
    return this.prisma.blueprint.findUnique({
      where: { id },
      include: {
        examConfig: {
          include: { sections: true },
        },
        styleProfile: {
          include: { characteristics: true },
        },
      },
    });
  }

  async findAllWithRelations() {
    return this.prisma.blueprint.findMany({
      include: {
        examConfig: true,
        styleProfile: {
          include: { characteristics: true },
        },
      },
    });
  }
}
