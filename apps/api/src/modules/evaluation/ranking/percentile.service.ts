import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PercentileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates the percentile band/bucket for an attempt and stores it in the database.
   */
  async calculateAndStorePercentile(
    attemptId: string,
    percentile: number,
  ): Promise<void> {
    // Determine the percentile bucket/band
    let bucket = "Other";
    if (percentile >= 99.0) {
      bucket = "Top 1%";
    } else if (percentile >= 95.0) {
      bucket = "Top 5%";
    } else if (percentile >= 90.0) {
      bucket = "Top 10%";
    } else if (percentile >= 75.0) {
      bucket = "Top 25%";
    } else if (percentile >= 50.0) {
      bucket = "Top 50%";
    }

    // Upsert into candidate_percentiles
    await this.prisma.candidatePercentile.upsert({
      where: { attemptId },
      update: {
        percentile,
        bucket,
        createdAt: new Date(),
      },
      create: {
        attemptId,
        percentile,
        bucket,
        createdAt: new Date(),
      },
    });
  }
}
