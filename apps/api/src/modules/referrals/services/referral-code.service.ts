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
    opts: { maxUses?: number; expiresAt?: string } = {},
  ) {
    // @ts-ignore — Prisma model added by DB migration subagent; types may not be generated yet
    const campaign = await this.prisma.referralCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    let code: string;
    let attempts = 0;
    do {
      code = this.generateRandomCode();
      attempts++;
      if (attempts > 20) throw new BadRequestException('Could not generate unique code');
      // @ts-ignore
    } while (await this.prisma.referralCode.findUnique({ where: { code } }));

    // @ts-ignore
    return this.prisma.referralCode.create({
      data: {
        campaignId,
        code: code!,
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
