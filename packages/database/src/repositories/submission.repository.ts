import { PrismaClient, Submission, SubmissionStatus } from "@prisma/client";

export class SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSubmission(testInstanceId: string): Promise<Submission> {
    const existing = await this.prisma.submission.findFirst({
      where: { testInstanceId, isCurrent: true },
    });
    if (existing) return existing;

    const count = await this.prisma.submission.count({
      where: { testInstanceId },
    });
    return await this.prisma.submission.create({
      data: {
        testInstanceId,
        status: SubmissionStatus.PENDING,
        attemptSequence: count + 1,
        isCurrent: true,
      },
    });
  }

  async findByInstance(testInstanceId: string): Promise<Submission | null> {
    return await this.prisma.submission.findFirst({
      where: { testInstanceId, isCurrent: true },
    });
  }

  async updateStatus(
    testInstanceId: string,
    status: SubmissionStatus,
    submissionHash?: string,
  ): Promise<Submission> {
    const current = await this.findByInstance(testInstanceId);
    if (!current) {
      throw new Error(`Submission for test instance ${testInstanceId} not found`);
    }
    return await this.prisma.submission.update({
      where: { id: current.id },
      data: {
        status,
        ...(status === SubmissionStatus.SUBMITTED
          ? { submittedAt: new Date() }
          : {}),
        ...(submissionHash ? { submissionHash } : {}),
      },
    });
  }
}
