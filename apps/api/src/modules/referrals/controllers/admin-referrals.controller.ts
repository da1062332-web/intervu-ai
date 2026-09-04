import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReferralCampaignService } from '../services/referral-campaign.service';
import { ReferralCodeService } from '../services/referral-code.service';
import { ReferralEngineService } from '../services/referral-engine.service';

@ApiTags('admin-referrals')
@Controller('admin/referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PLAN_MANAGER)
@ApiBearerAuth('jwt-auth')
export class AdminReferralsController {
  constructor(
    private readonly campaignService: ReferralCampaignService,
    private readonly codeService: ReferralCodeService,
    private readonly engine: ReferralEngineService,
  ) {}

  // ─── Campaigns ────────────────────────────────────────────────────────────

  @Get('campaigns')
  @ApiOperation({ summary: 'List all referral campaigns (paginated)' })
  async getCampaigns(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.campaignService.getAllCampaigns(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a new referral campaign' })
  async createCampaign(@Body() body: any) {
    return this.campaignService.createCampaign(body);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get a campaign by ID with codes' })
  async getCampaign(@Param('id') id: string) {
    return this.campaignService.getCampaignById(id);
  }

  @Put('campaigns/:id')
  @ApiOperation({ summary: 'Update a referral campaign' })
  async updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.campaignService.updateCampaign(id, body);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a campaign (only if no redemptions exist)' })
  async deleteCampaign(@Param('id') id: string) {
    return this.campaignService.deleteCampaign(id);
  }

  // ─── Codes ────────────────────────────────────────────────────────────────

  @Post('campaigns/:campaignId/codes')
  @ApiOperation({ summary: 'Generate a new referral code for a campaign' })
  async generateCode(
    @Param('campaignId') campaignId: string,
    @Body() body: { maxUses?: number; expiresAt?: string; code?: string },
  ) {
    return this.codeService.generateAdminCode(campaignId, body);
  }

  @Get('campaigns/:campaignId/codes')
  @ApiOperation({ summary: 'Get all codes for a campaign' })
  async getCodes(@Param('campaignId') campaignId: string) {
    return this.codeService.getCodesByCampaign(campaignId);
  }

  @Delete('codes/:codeId')
  @ApiOperation({ summary: 'Deactivate a referral code' })
  async deactivateCode(@Param('codeId') codeId: string) {
    return this.codeService.deactivateCode(codeId);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  @Get('overview')
  @ApiOperation({ summary: 'Get referral system overview stats' })
  async getOverview() {
    return this.campaignService.getOverviewStats();
  }
}
