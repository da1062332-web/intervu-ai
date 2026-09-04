import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReferralCodeService {
  private readonly logger = new Logger(ReferralCodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async generateAdminCode(
    campaignId: string,
    opts: { maxUses?: number; expiresAt?: string; code?: string } = {},
  ) {
    // @ts-ignore
    const campaign = await this.prisma.referralCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    let code: string;
    if (opts.code && opts.code.trim()) {
      code = opts.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (code.length < 2 || code.length > 30) {
        throw new BadRequestException('Custom referral code must be between 2 and 30 alphanumeric characters');
      }
      // @ts-ignore
      const existing = await this.prisma.referralCode.findUnique({ where: { code } });
      if (existing) {
        throw new BadRequestException(`Referral code "${code}" is already in use. Please enter a different code.`);
      }
    } else {
      let attempts = 0;
      do {
        code = this.generateRandomCode();
        attempts++;
        if (attempts > 20) throw new BadRequestException('Could not generate unique code');
        // @ts-ignore
      } while (await this.prisma.referralCode.findUnique({ where: { code } }));
    }

    // @ts-ignore
    return this.prisma.referralCode.create({
      data: {
        campaignId,
        code,
        isActive: true,
        maxUses: opts.maxUses ?? null,
        expiresAt: opts.expiresAt ? new Date(opts.expiresAt) : null,
      },
    });
  }

  async getCodesByCampaign(campaignId: string) {
    // @ts-ignore — Prisma model added by DB migration subagent; types may not be generated yet
    return this.prisma.referralCode.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateCode(codeId: string) {
    // @ts-ignore — Prisma model added by DB migration subagent; types may not be generated yet
    const code = await this.prisma.referralCode.findUnique({ where: { id: codeId } });
    if (!code) throw new NotFoundException('Code not found');
    // @ts-ignore
    return this.prisma.referralCode.update({
      where: { id: codeId },
      data: { isActive: false },
    });
  }
}
