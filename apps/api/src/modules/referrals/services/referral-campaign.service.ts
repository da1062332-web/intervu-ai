import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReferralCampaignService {
  private readonly logger = new Logger(ReferralCampaignService.name);
  private statsCache: { data: any; timestamp: number } | null = null;
  private readonly STATS_TTL = 30000; // 30s in-memory cache

  constructor(private readonly prisma: PrismaService) {}

  clearCache() {
    this.statsCache = null;
  }

  async getAllCampaigns(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      // @ts-ignore
      this.prisma.referralCampaign.count(),
      // @ts-ignore
      this.prisma.referralCampaign.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          codes: {
            orderBy: { createdAt: 'desc' },
            take: 25,
          },
          _count: { select: { codes: true, redemptions: true, events: true } },
        },
      }),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCampaignById(id: string) {
    // @ts-ignore — Prisma model added by DB migration subagent; types may not be generated yet
    const campaign = await this.prisma.referralCampaign.findUnique({
      where: { id },
      include: {
        codes: { orderBy: { createdAt: 'desc' }, take: 50 },
        _count: { select: { redemptions: true, events: true } },
      },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  async createCampaign(dto: any) {
    // @ts-ignore
    const created = await this.prisma.referralCampaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type ?? 'COMPANY',
        status: 'ACTIVE',
        referrerRewardConfig: dto.referrerRewardConfig ?? {},
        refereeRewardConfig: dto.refereeRewardConfig ?? {},
        eligibilityConfig: dto.eligibilityConfig ?? {},
        totalRedemptionLimit: dto.totalRedemptionLimit ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
    this.clearCache();
    return created;
  }

  async updateCampaign(id: string, dto: any) {
    await this.getCampaignById(id); // ensure exists
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.referrerRewardConfig !== undefined) data.referrerRewardConfig = dto.referrerRewardConfig;
    if (dto.refereeRewardConfig !== undefined) data.refereeRewardConfig = dto.refereeRewardConfig;
    if (dto.eligibilityConfig !== undefined) data.eligibilityConfig = dto.eligibilityConfig;
    if (dto.totalRedemptionLimit !== undefined) data.totalRedemptionLimit = dto.totalRedemptionLimit;
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt ? new Date(dto.startsAt) : undefined;
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    // @ts-ignore
    const updated = await this.prisma.referralCampaign.update({ where: { id }, data });
    this.clearCache();
    return updated;
  }

  async deleteCampaign(id: string) {
    // @ts-ignore
    const count = await this.prisma.referralRedemption.count({ where: { campaignId: id } });
    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete campaign with ${count} existing redemptions. Pause or expire it instead.`,
      );
    }
    // @ts-ignore
    await this.prisma.referralCampaign.delete({ where: { id } });
    this.clearCache();
    return { success: true };
  }

  async getOverviewStats() {
    if (this.statsCache && Date.now() - this.statsCache.timestamp < this.STATS_TTL) {
      return this.statsCache.data;
    }

    const [totalCampaigns, activeCampaigns, totalRedemptions, totalEvents, totalRewarded] =
      await Promise.all([
        // @ts-ignore
        this.prisma.referralCampaign.count(),
        // @ts-ignore
        this.prisma.referralCampaign.count({ where: { status: 'ACTIVE' } }),
        // @ts-ignore
        this.prisma.referralRedemption.count(),
        // @ts-ignore
        this.prisma.referralEvent.count(),
        // @ts-ignore
        this.prisma.referralEvent.count({ where: { status: 'REWARDED' } }),
      ]);

    const stats = {
      totalCampaigns,
      activeCampaigns,
      totalRedemptions,
      totalEvents,
      totalRewarded,
    };

    this.statsCache = {
      data: stats,
      timestamp: Date.now(),
    };

    return stats;
  }
}
