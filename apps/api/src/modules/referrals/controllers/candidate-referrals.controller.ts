import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReferralEngineService } from '../services/referral-engine.service';

@ApiTags('candidate-referrals')
@Controller('candidate/referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@ApiBearerAuth('jwt-auth')
export class CandidateReferralsController {
  constructor(private readonly engine: ReferralEngineService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get candidate referral status: personal code, stats, history',
  })
  async getReferralStatus(@Request() req: any) {
    const userId: string = req.user.id;
    const baseUrl = process.env.FRONTEND_URL || 'https://www.skillitrix.com';
    return this.engine.getCandidateReferralStatus(userId, baseUrl);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a referral code' })
  async redeemCode(
    @Request() req: any,
    @Body('code') code: string,
  ) {
    const userId: string = req.user.id;
    return this.engine.redeemCode(userId, code);
  }
}
