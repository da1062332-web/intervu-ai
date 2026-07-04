import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class RuntimeSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAccess(testId: string): Promise<boolean> {
    // Validate: Published, Not Archived, Not Deleted, Runtime Exists, Runtime Enabled
    // The testId typically maps to AssembledTest ID from the assembly module

    const assembly = await this.prisma.assembledTest.findUnique({
      where: { id: testId },
      include: {
        examConfig: true,
      },
    });

    if (!assembly) {
      throw new ForbiddenException("Runtime does not exist");
    }

    if (assembly.status === "ARCHIVED") {
      throw new ForbiddenException("Runtime is archived");
    }

    if (assembly.status !== "PUBLISHED") {
      throw new ForbiddenException("Runtime is not published");
    }

    if (assembly.examConfig?.isArchived) {
      throw new ForbiddenException("Exam Configuration is archived");
    }

    if (assembly.examConfig?.isActive === false) {
      throw new ForbiddenException("Exam Configuration is disabled");
    }

    return true;
  }
}
