import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class UsageQuotaService {
  private readonly logger = new Logger(UsageQuotaService.name);

  constructor(private readonly prisma: PrismaService) {}

  getCurrentPeriodKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  getQuotaKey(subscriptionId?: string): string {
    if (subscriptionId) {
      return `sub_${subscriptionId}`;
    }
    return this.getCurrentPeriodKey();
  }

  async getOrCreateCurrentQuota(userId: string, subscriptionId?: string) {
    const periodKey = this.getQuotaKey(subscriptionId);
    try {
      let existing = await this.prisma.usageQuota.findUnique({
        where: {
          userId_periodKey: {
            userId,
            periodKey,
          },
        },
      });

      if (!existing && subscriptionId) {
        // Fallback check for periodKey YYYY-MM
        const legacy = await this.prisma.usageQuota.findUnique({
          where: {
            userId_periodKey: {
              userId,
              periodKey: this.getCurrentPeriodKey(),
            },
          },
        });
        if (legacy) {
          existing = legacy;
        }
      }

      if (existing) {
        return existing;
      }

      return await this.prisma.usageQuota.create({
        data: {
          userId,
          subscriptionId,
          periodKey,
          roundsUsed: 0,
          questionsAttempted: 0,
          exportsUsed: 0,
        },
      });
    } catch (error) {
      this.logger.error(`Error getting/creating quota for user ${userId}:`, error);
      // Fallback in case of race condition
      return await this.prisma.usageQuota.findUnique({
        where: {
          userId_periodKey: {
            userId,
            periodKey,
          },
        },
      });
    }
  }

  /**
   * Truly Atomic Round Quota Reservation
   * Prevents race conditions where concurrent requests exceed package/plan round limits.
   */
  async consumeRoundQuota(
    userId: string,
    maxAllowedRounds: number | null,
    subscriptionId?: string,
  ): Promise<{ allowed: boolean; roundsUsed: number; remaining: number | null }> {
    const periodKey = this.getQuotaKey(subscriptionId);

    // 1. Unlimited plans (Pro / Teams)
    if (maxAllowedRounds === null) {
      const roundsUsed = await this.incrementRoundsUsed(userId, subscriptionId);
      return { allowed: true, roundsUsed, remaining: null };
    }

    // 2. Atomic transaction with check-and-increment for limited plans
    return this.prisma.$transaction(async (tx) => {
      // Find existing quota record either by subscription key or fallback
      let current = await tx.usageQuota.findUnique({
        where: { userId_periodKey: { userId, periodKey } },
      });

      if (!current && subscriptionId) {
        const legacy = await tx.usageQuota.findUnique({
          where: { userId_periodKey: { userId, periodKey: this.getCurrentPeriodKey() } },
        });
        if (legacy) {
          current = legacy;
        }
      }

      if (!current) {
        current = await tx.usageQuota.create({
          data: {
            userId,
            subscriptionId,
            periodKey,
            roundsUsed: 0,
            questionsAttempted: 0,
            exportsUsed: 0,
          },
        });
      }

      const currentUsed = current?.roundsUsed ?? 0;

      if (currentUsed >= maxAllowedRounds) {
        this.logger.warn(
          `[QUOTA EXHAUSTED] User ${userId} attempted round (${currentUsed}/${maxAllowedRounds} used)`,
        );
        return {
          allowed: false,
          roundsUsed: currentUsed,
          remaining: 0,
        };
      }

      // Increment atomically within the transaction
      const updated = await tx.usageQuota.update({
        where: { id: current.id },
        data: {
          roundsUsed: {
            increment: 1,
          },
        },
      });

      this.logger.log(
        `[QUOTA CONSUMED] User ${userId} consumed round ${updated.roundsUsed}/${maxAllowedRounds}`,
      );

      return {
        allowed: true,
        roundsUsed: updated.roundsUsed,
        remaining: Math.max(0, maxAllowedRounds - updated.roundsUsed),
      };
    });
  }

  async incrementRoundsUsed(userId: string, subscriptionId?: string): Promise<number> {
    const periodKey = this.getQuotaKey(subscriptionId);
    const quota = await this.prisma.usageQuota.upsert({
      where: {
        userId_periodKey: {
          userId,
          periodKey,
        },
      },
      create: {
        userId,
        periodKey,
        roundsUsed: 1,
        questionsAttempted: 0,
        exportsUsed: 0,
      },
      update: {
        roundsUsed: {
          increment: 1,
        },
      },
    });

    return quota.roundsUsed;
  }

  async incrementQuestionsAttempted(userId: string, count = 1): Promise<number> {
    const periodKey = this.getCurrentPeriodKey();
    const quota = await this.prisma.usageQuota.upsert({
      where: {
        userId_periodKey: {
          userId,
          periodKey,
        },
      },
      create: {
        userId,
        periodKey,
        roundsUsed: 0,
        questionsAttempted: count,
        exportsUsed: 0,
      },
      update: {
        questionsAttempted: {
          increment: count,
        },
      },
    });

    return quota.questionsAttempted;
  }

  async incrementExportsUsed(userId: string): Promise<number> {
    const periodKey = this.getCurrentPeriodKey();
    const quota = await this.prisma.usageQuota.upsert({
      where: {
        userId_periodKey: {
          userId,
          periodKey,
        },
      },
      create: {
        userId,
        periodKey,
        roundsUsed: 0,
        questionsAttempted: 0,
        exportsUsed: 1,
      },
      update: {
        exportsUsed: {
          increment: 1,
        },
      },
    });

    return quota.exportsUsed;
  }
}
