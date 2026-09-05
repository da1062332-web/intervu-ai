import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface RewardConfig {
  featureKey: string;
  overrideValue: any;
  expiresInDays?: number | null;
  reason?: string;
}

@Injectable()
export class ReferralRewardService {
  private readonly logger = new Logger(ReferralRewardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Grant a reward to a user by creating a UserQuotaOverride.
   * The rewardConfig is read dynamically from campaign JSON - nothing is hardcoded here.
   */
  async grantReward(
    userId: string,
    rewardConfig: RewardConfig,
    idempotencyKey?: string,
    prismaClient?: any,
  ): Promise<{ overrideId: string; granted: boolean }> {
    const db = prismaClient || this.prisma;
    if (!rewardConfig) {
      this.logger.warn(`grantReward: empty rewardConfig for user ${userId}`);
      return { overrideId: '', granted: false };
    }

    // Support multiple rewards in single configuration
    if (Array.isArray((rewardConfig as any).rewards)) {
      let firstOverrideId = '';
      for (const subReward of (rewardConfig as any).rewards) {
        const res = await this.grantReward(userId, subReward, idempotencyKey, db);
        if (!firstOverrideId) firstOverrideId = res.overrideId;
      }
      return { overrideId: firstOverrideId, granted: true };
    }

    if (!rewardConfig.featureKey) {
      this.logger.warn(`grantReward: empty rewardConfig.featureKey for user ${userId}`);
      return { overrideId: '', granted: false };
    }

    const expiresAt = rewardConfig.expiresInDays
      ? new Date(Date.now() + rewardConfig.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const reason =
      rewardConfig.reason ||
      (idempotencyKey ? `Referral reward [${idempotencyKey}]` : 'Referral reward');

    // Ensure candidate has an active subscription record so EntitlementService recognizes the account
    if (db?.subscription?.upsert) {
      await db.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: 'FREE',
          status: 'ACTIVE',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
        update: {},
      });
    }

    const override = await db.userQuotaOverride.create({
      data: {
        userId,
        featureKey: rewardConfig.featureKey,
        overrideValue: rewardConfig.overrideValue,
        reason,
        expiresAt,
      },
    });

    // If specific assessment was assigned AND bonus round was provided, also grant rounds quota
    const attempts = rewardConfig.overrideValue?.attemptsPerExam;
    const bonusRounds =
      typeof (rewardConfig as any).bonusRounds === 'number'
        ? (rewardConfig as any).bonusRounds
        : typeof attempts === 'number'
          ? attempts
          : 0;

    if (
      rewardConfig.featureKey === 'allowed_assessments' &&
      bonusRounds > 0
    ) {
      await db.userQuotaOverride.create({
        data: {
          userId,
          featureKey: 'monthly_rounds_limit',
          overrideValue: { bonusRounds },
          reason: `${reason} (+${bonusRounds} Bonus ${bonusRounds > 1 ? 'Rounds' : 'Round'})`,
          expiresAt,
        },
      });
    }

    this.logger.log(
      `Granted referral reward to user ${userId}: featureKey=${rewardConfig.featureKey}, value=${JSON.stringify(rewardConfig.overrideValue)}`,
    );
    return { overrideId: override.id, granted: true };
  }
}
