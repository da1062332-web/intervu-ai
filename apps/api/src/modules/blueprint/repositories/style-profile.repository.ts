import { Injectable, Optional } from "@nestjs/common";
import { StyleProfile, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class StyleProfileRepository extends BaseRepository<
  StyleProfile,
  Prisma.StyleProfileCreateInput,
  Prisma.StyleProfileUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "styleProfile", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new StyleProfileRepository(this.prisma, tx) as this;
  }

  async findByName(name: string) {
    return this.prisma.styleProfile.findFirst({
      where: { name },
      include: { characteristics: true },
    });
  }

  async findActive() {
    return this.prisma.styleProfile.findMany({
      where: { active: true },
      include: { characteristics: true },
    });
  }

  async findByIdWithCharacteristics(id: string) {
    return this.prisma.styleProfile.findUnique({
      where: { id },
      include: { characteristics: true },
    });
  }

  async createWithCharacteristics(
    data: Prisma.StyleProfileCreateWithoutCharacteristicsInput,
    characteristics: { name: string; value: unknown }[],
  ) {
    return this.prisma.styleProfile.create({
      data: {
        ...data,
        characteristics: {
          create: characteristics.map((c) => ({
            characteristicName: c.name,
            characteristicValue: c.value as Prisma.InputJsonValue,
          })),
        },
      },
      include: { characteristics: true },
    });
  }

  async updateWithCharacteristics(
    id: string,
    data: Prisma.StyleProfileUpdateWithoutCharacteristicsInput,
    characteristics?: { name: string; value: unknown }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (characteristics && characteristics.length > 0) {
        // Delete existing characteristics
        await tx.styleProfileCharacteristic.deleteMany({
          where: { profileId: id },
        });

        // Insert new characteristics
        await tx.styleProfileCharacteristic.createMany({
          data: characteristics.map((c) => ({
            profileId: id,
            characteristicName: c.name,
            characteristicValue: c.value as Prisma.InputJsonValue,
          })),
        });
      }

      return tx.styleProfile.update({
        where: { id },
        data,
        include: { characteristics: true },
      });
    });
  }

  async findAllWithCharacteristics() {
    return this.prisma.styleProfile.findMany({
      include: { characteristics: true },
    });
  }
}
