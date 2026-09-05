import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReferralRewardService, RewardConfig } from './referral-reward.service';

@Injectable()
export class ReferralEngineService {
  private readonly logger = new Logger(ReferralEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardService: ReferralRewardService,
  ) {}

  /**
   * COMPANY -> CANDIDATE FLOW
   * Candidate redeems a company-generated referral code.
   * Validates campaign, eligibility, limits, then grants configured reward.
   * Fully idempotent: second call for same user+code returns success without double-granting.
   */
  async redeemCode(userId: string, code: string) {
    const result = await this.prisma.$transaction(
      async (tx: any) => {
      // 1. Find the referral code
      const referralCode = await tx.referralCode.findUnique({
        where: { code },
        include: { campaign: true },
      });

      if (!referralCode || !referralCode.isActive) {
        throw new NotFoundException('Referral code not found or inactive');
      }

      const campaign = referralCode.campaign;

      // 2. Campaign validity checks
      if (campaign.status !== 'ACTIVE') {
        throw new BadRequestException(`Campaign is ${campaign.status}`);
      }
      const now = new Date();
      if (campaign.endsAt && campaign.endsAt < now) {
        throw new BadRequestException('Campaign has expired');
      }
      if (campaign.startsAt > now) {
        throw new BadRequestException('Campaign has not started yet');
      }

      // 3. Total redemption limit check
      if (
        campaign.totalRedemptionLimit !== null &&
        campaign.totalRedemptionCount >= campaign.totalRedemptionLimit
      ) {
        throw new BadRequestException('Campaign redemption limit reached');
      }

      // 4. Per-code use limit check
      if (referralCode.maxUses !== null && referralCode.usedCount >= referralCode.maxUses) {
        throw new BadRequestException('Code usage limit reached');
      }

      // 5. Code expiry check
      if (referralCode.expiresAt && referralCode.expiresAt < now) {
        throw new BadRequestException('Code has expired');
      }

      // 6. Self-referral check
      const eligibility = (campaign.eligibilityConfig as any) || {};
      if (!eligibility.allowSelfReferral && referralCode.userId === userId) {
        throw new BadRequestException('You cannot redeem your own referral code');
      }

      // 7. Idempotency: Check if user already redeemed this specific code
      const existing = await tx.referralRedemption.findUnique({
        where: { userId_codeId: { userId, codeId: referralCode.id } },
      });
      if (existing) {
        return {
          success: true,
          message: 'Code already redeemed',
          alreadyRedeemed: true,
          redemptionId: existing.id,
        };
      }

      // 8. Per-user redemption limit check (from eligibilityConfig)
      const maxPerUser = eligibility.maxRedemptionsPerUser ?? 1;
      const userRedemptionCount = await tx.referralRedemption.count({
        where: { userId, campaignId: campaign.id },
      });
      if (userRedemptionCount >= maxPerUser) {
        throw new BadRequestException(
          `You have already redeemed the maximum number of codes for this campaign (${maxPerUser})`,
        );
      }

      // 9. Resolve reward from campaign JSON config (NOT hardcoded)
      const refereeRewardConfig = campaign.refereeRewardConfig as RewardConfig;

      // 10. Grant the reward via ReferralRewardService -> UserQuotaOverride
      const idempotencyKey = `${campaign.id}:${referralCode.id}:${userId}`;
      let rewardGrantResult = { overrideId: '', granted: false };
      if (refereeRewardConfig && refereeRewardConfig.featureKey) {
        rewardGrantResult = await this.rewardService.grantReward(
          userId,
          refereeRewardConfig,
          idempotencyKey,
          tx,
        );
      }

      // 11. Record the redemption
      const redemption = await tx.referralRedemption.create({
        data: {
          campaignId: campaign.id,
          codeId: referralCode.id,
          userId,
          rewardSnapshot: refereeRewardConfig || {},
        },
      });

      // 12. Update counters atomically
      await tx.referralCode.update({
        where: { id: referralCode.id },
        data: { usedCount: { increment: 1 } },
      });
      await tx.referralCampaign.update({
        where: { id: campaign.id },
        data: { totalRedemptionCount: { increment: 1 } },
      });

      // 13. If this is a CANDIDATE-type code (referralCode.userId set), create a ReferralEvent
      //     and optionally reward the referrer immediately
      if (campaign.type === 'CANDIDATE' && referralCode.userId) {
        await this.processReferralEvent(
          tx,
          campaign.id,
          referralCode.userId, // referrer
          userId, // referred
          referralCode.id,
          campaign.referrerRewardConfig as RewardConfig,
          refereeRewardConfig,
        );
      }

      return {
        success: true,
        message: rewardGrantResult.granted
          ? 'Code redeemed successfully! Your reward has been granted.'
          : 'Code redeemed successfully!',
        redemptionId: redemption.id,
        reward: refereeRewardConfig,
      };
    }, {
      maxWait: 30000,
      timeout: 90000,
    });

    ReferralEngineService.invalidateCandidateReferralCache(userId);
    return result;
  }

  /**
   * Process a Candidate->Candidate referral event.
   * Called from within the redeemCode transaction.
   */
  private async processReferralEvent(
    tx: any,
    campaignId: string,
    referrerId: string,
    referredId: string,
    codeId: string,
    referrerRewardConfig: RewardConfig,
    refereeRewardConfig: RewardConfig,
  ) {
    // Idempotency: one event per referred candidate
    const existingEvent = await tx.referralEvent.findUnique({
      where: { referredId },
    });
    if (existingEvent) return existingEvent;

    // Create the event
    const event = await tx.referralEvent.create({
      data: {
        campaignId,
        referrerId,
        referredId,
        codeId,
        status: 'QUALIFIED',
        refereeRewardSnapshot: refereeRewardConfig || null,
        referrerRewardSnapshot: referrerRewardConfig || null,
        qualifiedAt: new Date(),
      },
    });

    // Grant referrer reward if configured
    if (referrerRewardConfig && referrerRewardConfig.featureKey) {
      const idempotencyKey = `referrer:${campaignId}:${referredId}`;
      await this.rewardService.grantReward(referrerId, referrerRewardConfig, idempotencyKey, tx);

      // Mark as REWARDED
      await tx.referralEvent.update({
        where: { id: event.id },
        data: { status: 'REWARDED', rewardedAt: new Date() },
      });
    }

    return event;
  }

  /**
   * In-memory cache & deduplication for candidate referral status
   */
  private static referralStatusMemCache = new Map<string, { data: any; expiresAt: number }>();
  private static inFlightReferralStatus = new Map<string, Promise<any>>();

  public static invalidateCandidateReferralCache(userId?: string) {
    if (userId) {
      ReferralEngineService.referralStatusMemCache.delete(userId);
    } else {
      ReferralEngineService.referralStatusMemCache.clear();
    }
  }

  /**
   * Get a candidate's referral status: their personal code, stats, events.
   */
  async getCandidateReferralStatus(userId: string, baseUrl: string) {
    const cached = ReferralEngineService.referralStatusMemCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const existingPromise = ReferralEngineService.inFlightReferralStatus.get(userId);
    if (existingPromise) {
      return existingPromise;
    }

    const requestPromise = this.computeCandidateReferralStatus(userId, baseUrl)
      .then((data) => {
        ReferralEngineService.referralStatusMemCache.set(userId, {
          data,
          expiresAt: Date.now() + 30_000, // 30s cache
        });
        ReferralEngineService.inFlightReferralStatus.delete(userId);
        return data;
      })
      .catch((err) => {
        ReferralEngineService.inFlightReferralStatus.delete(userId);
        throw err;
      });

    ReferralEngineService.inFlightReferralStatus.set(userId, requestPromise);
    return requestPromise;
  }

  private async computeCandidateReferralStatus(userId: string, baseUrl: string) {
    // Find active CANDIDATE-type campaign
    // @ts-ignore — Prisma models added by DB migration subagent; types may not be generated yet
    const candidateCampaign = await this.prisma.referralCampaign.findFirst({
      where: {
        type: 'CANDIDATE',
        status: 'ACTIVE',
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    let personalCode: string | null = null;
    let referralLink: string | null = null;

    if (candidateCampaign) {
      // Find or create personal code
      // @ts-ignore
      let existingCode = await this.prisma.referralCode.findFirst({
        where: { campaignId: candidateCampaign.id, userId, isActive: true },
      });

      if (!existingCode) {
        // Generate a new unique code
        let code: string;
        let attempts = 0;
        do {
          code = this.generateRandomCode();
          attempts++;
          if (attempts > 20) throw new Error('Could not generate unique code');
          // @ts-ignore
        } while (await this.prisma.referralCode.findUnique({ where: { code } }));

        // @ts-ignore
        existingCode = await this.prisma.referralCode.create({
          data: {
            campaignId: candidateCampaign.id,
            userId,
            code: code!,
            isActive: true,
          },
        });
      }

      personalCode = existingCode.code;
      referralLink = `${baseUrl}/signup?ref=${existingCode.code}`;
    }

    // Run counts, event history, and redemptions in parallel
    const [
      totalReferrals,
      pendingReferrals,
      rewardedReferrals,
      events,
      redemptions,
    ] = await Promise.all([
      // @ts-ignore
      this.prisma.referralEvent.count({ where: { referrerId: userId } }),
      // @ts-ignore
      this.prisma.referralEvent.count({ where: { referrerId: userId, status: 'PENDING' } }),
      // @ts-ignore
      this.prisma.referralEvent.count({ where: { referrerId: userId, status: 'REWARDED' } }),
      // @ts-ignore
      this.prisma.referralEvent.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // @ts-ignore
      this.prisma.referralRedemption.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      personalCode,
      referralLink,
      totalReferrals,
      pendingReferrals,
      rewardedReferrals,
      events,
      redemptions,
    };
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
