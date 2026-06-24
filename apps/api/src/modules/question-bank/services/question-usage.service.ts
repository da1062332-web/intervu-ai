import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class QuestionUsageService {
  private readonly logger = new Logger(QuestionUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tracks usage of questions reserved for an assembly when the candidate starts the test.
   * Deletes reservations and updates usage statistics atomically.
   */
  async trackUsage(
    assemblyId: string,
    examId: string,
    sectionId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = tx || this.prisma;

    // Use transaction if tx client is not provided to ensure atomicity
    const execute = async (transaction: Prisma.TransactionClient) => {
      // 1. Fetch active reservations for this assemblyId
      const reservations = await transaction.questionReservation.findMany({
        where: { assemblyId },
      });

      if (reservations.length === 0) {
        this.logger.warn(`No reservations found for assembly ID: ${assemblyId}`);
        return 0;
      }

      const now = new Date();

      for (const res of reservations) {
        const questionId = res.questionId;

        // 2. Increment question times_used and set last_used directly on the question
        await transaction.question.update({
          where: { id: questionId },
          data: {
            timesUsed: { increment: 1 },
            lastUsed: now,
          },
        });

        // 3. Upsert QuestionUsage statistics
        const existingUsage = await transaction.questionUsage.findUnique({
          where: { questionId },
        });

        const examUsage = existingUsage ? (existingUsage.examUsage as Record<string, number>) : {};
        const sectionUsage = existingUsage ? (existingUsage.sectionUsage as Record<string, number>) : {};

        examUsage[examId] = (examUsage[examId] || 0) + 1;
        sectionUsage[sectionId] = (sectionUsage[sectionId] || 0) + 1;

        await transaction.questionUsage.upsert({
          where: { questionId },
          create: {
            questionId,
            timesUsed: 1,
            lastUsed: now,
            examUsage,
            sectionUsage,
          },
          update: {
            timesUsed: { increment: 1 },
            lastUsed: now,
            examUsage,
            sectionUsage,
          },
        });
      }

      // 4. Delete the assembly reservations since they are now consumed
      const deleteResult = await transaction.questionReservation.deleteMany({
        where: { assemblyId },
      });

      this.logger.log(
        `Tracked usage for ${reservations.length} questions and cleared reservations for assembly ID: ${assemblyId}`
      );
      return deleteResult.count;
    };

    if (tx) {
      return execute(tx);
    } else {
      return this.prisma.$transaction(execute);
    }
  }
}
