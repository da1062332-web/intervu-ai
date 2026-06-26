import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssemblyVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createVersion(
    assemblyId: string,
    version: number,
    snapshot: Prisma.InputJsonValue,
  ) {
    return this.prisma.assemblyVersion.create({
      data: {
        assemblyId,
        version,
        snapshot,
      },
    });
  }

  async findByAssemblyId(assemblyId: string) {
    return this.prisma.assemblyVersion.findMany({
      where: { assemblyId },
      orderBy: { version: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.assemblyVersion.findUnique({
      where: { id },
    });
  }

  async getLatestVersionNumber(assemblyId: string): Promise<number> {
    const latest = await this.prisma.assemblyVersion.findFirst({
      where: { assemblyId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return latest?.version || 0;
  }
}
