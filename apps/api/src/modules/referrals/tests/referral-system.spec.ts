import { Test, TestingModule } from '@nestjs/testing';
import { ReferralEngineService } from '../services/referral-engine.service';
import { ReferralRewardService } from '../services/referral-reward.service';
import { ReferralCampaignService } from '../services/referral-campaign.service';
import { ReferralCodeService } from '../services/referral-code.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Dynamic Referral System (End-to-End Logic)', () => {
  let engineService: ReferralEngineService;
  let rewardService: ReferralRewardService;
  let campaignService: ReferralCampaignService;
  let codeService: ReferralCodeService;

  // In-memory mock storage
  let campaigns: any[] = [];
  let codes: any[] = [];
  let redemptions: any[] = [];
  let events: any[] = [];
  let overrides: any[] = [];

  let mockPrisma: any;

  beforeEach(async () => {
    campaigns = [];
    codes = [];
    redemptions = [];
    events = [];
    overrides = [];

    mockPrisma = {
      referralCampaign: {
        findUnique: jest.fn(async ({ where }) => campaigns.find((c) => c.id === where.id) || null),
        findFirst: jest.fn(async ({ where }) => {
          return (
            campaigns.find(
              (c) =>
                (!where.type || c.type === where.type) &&
                (!where.status || c.status === where.status),
            ) || null
          );
        }),
        findMany: jest.fn(async () => [...campaigns]),
        create: jest.fn(async ({ data }) => {
          const item = { id: `camp-${Date.now()}-${Math.random()}`, ...data, totalRedemptionCount: 0, createdAt: new Date(), updatedAt: new Date() };
          campaigns.push(item);
          return item;
        }),
        update: jest.fn(async ({ where, data }) => {
          const idx = campaigns.findIndex((c) => c.id === where.id);
          if (idx === -1) throw new Error('Not found');
          if (data.totalRedemptionCount?.increment) {
            campaigns[idx].totalRedemptionCount += data.totalRedemptionCount.increment;
          } else {
            campaigns[idx] = { ...campaigns[idx], ...data };
          }
          return campaigns[idx];
        }),
        count: jest.fn(async () => campaigns.length),
      },
      referralCode: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.code) {
            const found = codes.find((c) => c.code === where.code);
            if (!found) return null;
            const camp = campaigns.find((ca) => ca.id === found.campaignId);
            return { ...found, campaign: camp };
          }
          if (where.id) return codes.find((c) => c.id === where.id) || null;
          return null;
        }),
        findFirst: jest.fn(async ({ where }) => {
          return (
            codes.find(
              (c) =>
                (!where.campaignId || c.campaignId === where.campaignId) &&
                (!where.userId || c.userId === where.userId) &&
                (where.isActive === undefined || c.isActive === where.isActive),
            ) || null
          );
        }),
        findMany: jest.fn(async ({ where }) =>
          codes.filter((c) => !where?.campaignId || c.campaignId === where.campaignId),
        ),
        create: jest.fn(async ({ data }) => {
          const item = { id: `code-${Date.now()}-${Math.random()}`, ...data, usedCount: 0, createdAt: new Date(), updatedAt: new Date() };
          codes.push(item);
          return item;
        }),
        update: jest.fn(async ({ where, data }) => {
          const idx = codes.findIndex((c) => c.id === where.id);
          if (idx === -1) throw new Error('Not found');
          if (data.usedCount?.increment) {
            codes[idx].usedCount += data.usedCount.increment;
          } else {
            codes[idx] = { ...codes[idx], ...data };
          }
          return codes[idx];
        }),
      },
      referralRedemption: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.userId_codeId) {
            return (
              redemptions.find(
                (r) =>
                  r.userId === where.userId_codeId.userId &&
                  r.codeId === where.userId_codeId.codeId,
              ) || null
            );
          }
          return null;
        }),
        count: jest.fn(async ({ where }) => {
          return redemptions.filter(
            (r) =>
              (!where.userId || r.userId === where.userId) &&
              (!where.campaignId || r.campaignId === where.campaignId),
          ).length;
        }),
        findMany: jest.fn(async ({ where }) =>
          redemptions.filter((r) => !where?.userId || r.userId === where.userId),
        ),
        create: jest.fn(async ({ data }) => {
          const item = { id: `red-${Date.now()}`, ...data, createdAt: new Date() };
          redemptions.push(item);
          return item;
        }),
      },
      referralEvent: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.referredId) {
            return events.find((e) => e.referredId === where.referredId) || null;
          }
          return null;
        }),
        count: jest.fn(async ({ where }) => {
          return events.filter(
            (e) =>
              (!where.referrerId || e.referrerId === where.referrerId) &&
              (!where.status || e.status === where.status),
          ).length;
        }),
        findMany: jest.fn(async ({ where }) =>
          events.filter((e) => !where?.referrerId || e.referrerId === where.referrerId),
        ),
        create: jest.fn(async ({ data }) => {
          const item = { id: `ev-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          events.push(item);
          return item;
        }),
        update: jest.fn(async ({ where, data }) => {
          const idx = events.findIndex((e) => e.id === where.id);
          if (idx !== -1) {
            events[idx] = { ...events[idx], ...data };
            return events[idx];
          }
          return null;
        }),
      },
      userQuotaOverride: {
        create: jest.fn(async ({ data }) => {
          const item = { id: `ov-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
          overrides.push(item);
          return item;
        }),
        findMany: jest.fn(async ({ where }) =>
          overrides.filter((o) => !where?.userId || o.userId === where.userId),
        ),
      },
      $transaction: jest.fn(async (callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralEngineService,
        ReferralRewardService,
        ReferralCampaignService,
        ReferralCodeService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    engineService = module.get<ReferralEngineService>(ReferralEngineService);
    rewardService = module.get<ReferralRewardService>(ReferralRewardService);
    campaignService = module.get<ReferralCampaignService>(ReferralCampaignService);
    codeService = module.get<ReferralCodeService>(ReferralCodeService);
  });

  describe('Dynamic Configuration Verification (1 assessment -> 2 assessments)', () => {
    it('grants 1 assessment bonus when configured for 1 assessment', async () => {
      // 1. Create campaign with 1 assessment bonus
      const campaign = await mockPrisma.referralCampaign.create({
        data: {
          name: '1-Assessment Campaign',
          type: 'COMPANY',
          status: 'ACTIVE',
          refereeRewardConfig: {
            featureKey: 'monthly_rounds_limit',
            overrideValue: { bonusRounds: 1 },
            expiresInDays: 30,
          },
          eligibilityConfig: { maxRedemptionsPerUser: 1 },
          startsAt: new Date(),
        },
      });

      const code = await mockPrisma.referralCode.create({
        data: {
          campaignId: campaign.id,
          code: 'BONUS1TEST',
          isActive: true,
        },
      });

      // 2. Redeem
      const result = await engineService.redeemCode('candidate-1', 'BONUS1TEST');
      expect(result.success).toBe(true);

      // 3. Verify UserQuotaOverride received bonusRounds: 1
      const userOverrides = overrides.filter((o) => o.userId === 'candidate-1');
      expect(userOverrides.length).toBe(1);
      expect(userOverrides[0].featureKey).toBe('monthly_rounds_limit');
      expect(userOverrides[0].overrideValue).toEqual({ bonusRounds: 1 });
    });

    it('grants 2 assessments bonus when campaign JSON is changed to 2 — WITHOUT ANY CODE CHANGES', async () => {
      // 1. Same campaign or updated campaign with 2 assessment bonus
      const campaign = await mockPrisma.referralCampaign.create({
        data: {
          name: '2-Assessment Campaign',
          type: 'COMPANY',
          status: 'ACTIVE',
          refereeRewardConfig: {
            featureKey: 'monthly_rounds_limit',
            overrideValue: { bonusRounds: 2 },
            expiresInDays: 60,
          },
          eligibilityConfig: { maxRedemptionsPerUser: 1 },
          startsAt: new Date(),
        },
      });

      const code = await mockPrisma.referralCode.create({
        data: {
          campaignId: campaign.id,
          code: 'BONUS2TEST',
          isActive: true,
        },
      });

      // 2. Candidate 2 redeems
      const result = await engineService.redeemCode('candidate-2', 'BONUS2TEST');
      expect(result.success).toBe(true);

      // 3. Verify UserQuotaOverride received bonusRounds: 2 dynamically
      const userOverrides = overrides.filter((o) => o.userId === 'candidate-2');
      expect(userOverrides.length).toBe(1);
      expect(userOverrides[0].overrideValue).toEqual({ bonusRounds: 2 });
    });
  });

  describe('Company -> Candidate Flow', () => {
    it('validates campaign status and blocks paused campaigns', async () => {
      const campaign = await mockPrisma.referralCampaign.create({
        data: {
          name: 'Paused Campaign',
          type: 'COMPANY',
          status: 'PAUSED',
          refereeRewardConfig: { featureKey: 'monthly_rounds_limit', overrideValue: { bonusRounds: 1 } },
          startsAt: new Date(),
        },
      });

      await mockPrisma.referralCode.create({
        data: { campaignId: campaign.id, code: 'PAUSEDCODE', isActive: true },
      });

      await expect(engineService.redeemCode('cand-x', 'PAUSEDCODE')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('enforces idempotency and prevents duplicate code redemption', async () => {
      const campaign = await mockPrisma.referralCampaign.create({
        data: {
          name: 'Idempotency Test',
          type: 'COMPANY',
          status: 'ACTIVE',
          refereeRewardConfig: { featureKey: 'monthly_rounds_limit', overrideValue: { bonusRounds: 1 } },
          startsAt: new Date(),
        },
      });

      await mockPrisma.referralCode.create({
        data: { campaignId: campaign.id, code: 'IDEMPOTENT1', isActive: true },
      });

      // First redemption
      const res1 = await engineService.redeemCode('cand-idem', 'IDEMPOTENT1');
      expect(res1.success).toBe(true);

      // Second redemption with same code
      const res2 = await engineService.redeemCode('cand-idem', 'IDEMPOTENT1');
      expect(res2.success).toBe(true);
      expect(res2.alreadyRedeemed).toBe(true);

      // Overrides must NOT be duplicated
      const userOverrides = overrides.filter((o) => o.userId === 'cand-idem');
      expect(userOverrides.length).toBe(1);
    });
  });

  describe('Candidate -> Candidate Flow (A -> B Dual Reward)', () => {
    it('rewards BOTH candidate A (referrer) and candidate B (referred) through Plan Manager', async () => {
      // 1. Active Candidate-to-Candidate campaign
      const campaign = await mockPrisma.referralCampaign.create({
        data: {
          name: 'Peer Referral 2025',
          type: 'CANDIDATE',
          status: 'ACTIVE',
          refereeRewardConfig: {
            featureKey: 'monthly_rounds_limit',
            overrideValue: { bonusRounds: 1 },
            reason: 'Referred by a peer',
          },
          referrerRewardConfig: {
            featureKey: 'monthly_rounds_limit',
            overrideValue: { bonusRounds: 2 },
            reason: 'Successful referral bonus',
          },
          eligibilityConfig: { allowSelfReferral: false, maxRedemptionsPerUser: 1 },
          startsAt: new Date(),
        },
      });

      // 2. Candidate A owns a code
      const codeA = await mockPrisma.referralCode.create({
        data: {
          campaignId: campaign.id,
          userId: 'candidate-A',
          code: 'CANDIDATE_A_CODE',
          isActive: true,
        },
      });

      // 3. Candidate B redeems Candidate A's code
      const result = await engineService.redeemCode('candidate-B', 'CANDIDATE_A_CODE');
      expect(result.success).toBe(true);

      // 4. Check Candidate B (referee) received 1 bonus assessment
      const bOverrides = overrides.filter((o) => o.userId === 'candidate-B');
      expect(bOverrides.length).toBe(1);
      expect(bOverrides[0].overrideValue).toEqual({ bonusRounds: 1 });

      // 5. Check Candidate A (referrer) received 2 bonus assessments
      const aOverrides = overrides.filter((o) => o.userId === 'candidate-A');
      expect(aOverrides.length).toBe(1);
      expect(aOverrides[0].overrideValue).toEqual({ bonusRounds: 2 });

      // 6. Check ReferralEvent was created and marked REWARDED
      const userEvents = events.filter((e) => e.referrerId === 'candidate-A' && e.referredId === 'candidate-B');
      expect(userEvents.length).toBe(1);
      expect(userEvents[0].status).toBe('REWARDED');
    });

    it('blocks self-referral (Candidate A cannot redeem their own code)', async () => {
      const campaign = await mockPrisma.referralCampaign.create({
        data: {
          name: 'Anti-Self-Referral',
          type: 'CANDIDATE',
          status: 'ACTIVE',
          refereeRewardConfig: { featureKey: 'monthly_rounds_limit', overrideValue: { bonusRounds: 1 } },
          referrerRewardConfig: { featureKey: 'monthly_rounds_limit', overrideValue: { bonusRounds: 1 } },
          eligibilityConfig: { allowSelfReferral: false },
          startsAt: new Date(),
        },
      });

      await mockPrisma.referralCode.create({
        data: {
          campaignId: campaign.id,
          userId: 'self-cand',
          code: 'SELFCODE123',
          isActive: true,
        },
      });

      await expect(engineService.redeemCode('self-cand', 'SELFCODE123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
