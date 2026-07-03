import { Injectable, Optional } from "@nestjs/common";
import { Prisma, CandidateEnrollment } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class EnrollmentRepository extends BaseRepository<
  CandidateEnrollment,
  Prisma.CandidateEnrollmentCreateInput,
  Prisma.CandidateEnrollmentUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "candidateEnrollment", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new EnrollmentRepository(this.prisma, tx) as this;
  }

  async findByUserAndTest(candidateId: string, testId: string) {
    return this.db.candidateEnrollment.findUnique({
      where: {
        candidateId_testId: {
          candidateId,
          testId,
        },
      },
    });
  }

  async findAllByUser(candidateId: string) {
    return this.db.candidateEnrollment.findMany({
      where: {
        candidateId,
      },
      include: {
        testConfig: {
          select: {
            displayName: true,
            companyName: true,
            totalDurationSeconds: true,
            totalQuestions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
