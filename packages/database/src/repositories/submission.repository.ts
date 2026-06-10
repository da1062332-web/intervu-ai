import { PrismaClient, Submission, SubmissionStatus } from "@prisma/client";

export class SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSubmission(testInstanceId: string): Promise<Submission> {
    // Lazily initialize a PENDING submission if it doesn't exist
    return await this.prisma.submission.upsert({
      where: { testInstanceId },
      update: {}, // Do nothing if it exists
      create: {
        testInstanceId,
        status: SubmissionStatus.PENDING,
      },
    });
  }

  async findByInstance(testInstanceId: string): Promise<Submission | null> {
    return await this.prisma.submission.findUnique({
      where: { testInstanceId },
    });
  }

  async updateStatus(
    testInstanceId: string, 
    status: SubmissionStatus, 
    submissionHash?: string
  ): Promise<Submission> {
    return await this.prisma.submission.update({
      where: { testInstanceId },
      data: {
        status,
        ...(status === SubmissionStatus.SUBMITTED ? { submittedAt: new Date() } : {}),
        ...(submissionHash ? { submissionHash } : {}),
      },
    });
  }
}
