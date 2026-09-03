import { Module } from '@nestjs/common';
import { ReferralCampaignService } from './services/referral-campaign.service';
import { ReferralCodeService } from './services/referral-code.service';
import { ReferralEngineService } from './services/referral-engine.service';
import { ReferralRewardService } from './services/referral-reward.service';
import { AdminReferralsController } from './controllers/admin-referrals.controller';
import { CandidateReferralsController } from './controllers/candidate-referrals.controller';

@Module({
  controllers: [AdminReferralsController, CandidateReferralsController],
  providers: [
    ReferralCampaignService,
    ReferralCodeService,
    ReferralEngineService,
    ReferralRewardService,
  ],
  exports: [ReferralEngineService, ReferralCodeService],
})
export class ReferralsModule {}
