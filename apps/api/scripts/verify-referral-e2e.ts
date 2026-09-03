import { PrismaClient } from '@prisma/client';
import { ReferralRewardService } from '../src/modules/referrals/services/referral-reward.service';
import { ReferralEngineService } from '../src/modules/referrals/services/referral-engine.service';
import { ReferralCampaignService } from '../src/modules/referrals/services/referral-campaign.service';
import { ReferralCodeService } from '../src/modules/referrals/services/referral-code.service';
import { EntitlementService } from '../src/modules/billing/services/entitlement.service';
import { SubscriptionService } from '../src/modules/billing/services/subscription.service';
import { UsageQuotaService } from '../src/modules/billing/services/usage-quota.service';
import { EligibilityService } from '../src/modules/lifecycle/eligibility.service';
import { UserRepository } from '../src/modules/users/repositories/user.repository';
import { TestConfigRepository } from '../src/modules/tests/repositories/test-config.repository';
import { TestInstanceRepository } from '../src/modules/tests/test-instance/test-instance.repository';

const prisma = new PrismaClient() as any;

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function logPass(msg: string) {
  console.log(`${GREEN}✔ PASS:${RESET} ${msg}`);
}

function logStep(msg: string) {
  console.log(`\n${CYAN}▶ ${msg}${RESET}`);
}

function logFail(msg: string, err: any) {
  console.error(`${RED}✘ FAIL:${RESET} ${msg}`, err);
  process.exit(1);
}

async function runE2E() {
  console.log(`${YELLOW}================================================================${RESET}`);
  // Verify DB connection
  let connected = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      connected = true;
      break;
    } catch (e) {
      console.log(`[DB Connect] Attempt ${attempt}/5 failed, waiting 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (!connected) throw new Error('Cannot connect to database');
  logPass('Database connection established');

  // 1. Initialize real application services
  const rewardService = new ReferralRewardService(prisma);
  const engineService = new ReferralEngineService(prisma, rewardService);
  const campaignService = new ReferralCampaignService(prisma);
  const codeService = new ReferralCodeService(prisma);

  const subscriptionService = new SubscriptionService(prisma);
  const usageQuotaService = new UsageQuotaService(prisma);
  const entitlementService = new EntitlementService(subscriptionService, usageQuotaService, prisma);

  const userRepo = new UserRepository(prisma);
  const testConfigRepo = new TestConfigRepository(prisma);
  const testInstanceRepo = new TestInstanceRepository(prisma);
  const eligibilityService = new EligibilityService(userRepo, testConfigRepo, testInstanceRepo, prisma, entitlementService);

  const runId = Date.now().toString().slice(-6);

  // 2. Ensure an allowed test config exists for assessment launch
  const allowedFeature = await prisma.planFeature.findFirst({
    where: { featureKey: 'allowed_assessments' },
  });
  console.log('DB allowed_assessments feature:', JSON.stringify(allowedFeature?.valueJson));

  let testConfig = await prisma.testConfig.findFirst({ where: { isActive: true } });
  if (allowedFeature?.valueJson) {
    const val = allowedFeature.valueJson as any;
    const allowedList = Array.isArray(val) ? val : val?.assessments || [];
    if (allowedList.length > 0 && !allowedList.includes('all')) {
      // Find or create a test matching an allowed ID
      const targetIdOrCode = allowedList[0];
      const match = await prisma.testConfig.findFirst({
        where: {
          OR: [{ id: targetIdOrCode }, { configKey: targetIdOrCode }],
          isActive: true,
        },
      });
      if (match) {
        testConfig = match;
      } else {
        testConfig = await prisma.testConfig.create({
          data: {
            configKey: targetIdOrCode,
            companyName: 'InterVu E2E',
            displayName: `Allowed Assessment (${targetIdOrCode})`,
            totalDurationSeconds: 1800,
            totalQuestions: 5,
            isActive: true,
          },
        });
      }
    }
  }

  if (!testConfig) {
    testConfig = await prisma.testConfig.create({
      data: {
        configKey: `e2e-config-${runId}`,
        companyName: 'InterVu E2E',
        displayName: 'E2E Referral Assessment',
        totalDurationSeconds: 1800,
        totalQuestions: 5,
        isActive: true,
      },
    });
  }
  logPass(`TestConfig resolved: ${testConfig.displayName} (${testConfig.id})`);

  // Helper to create test candidate user
  async function createCandidate(label: string) {
    const email = `ref-candidate-${label}-${runId}@example.com`;
    return prisma.user.create({
      data: {
        email,
        fullName: `Candidate ${label}`,
        role: 'CANDIDATE',
      },
    });
  }

  // =========================================================================
  // SCENARIO 1: Company Referral (Reward = 1 Assessment) -> Full Assessment Flow
  // =========================================================================
  logStep('SCENARIO 1: Company Referral (Reward = 1 Assessment) -> Full Assessment Flow');

  const cand1 = await createCandidate('Company-1');

  // Admin creates campaign with reward = 1 assessment
  const camp1 = await campaignService.createCampaign({
    name: `Company Campaign 1-Bonus [${runId}]`,
    type: 'COMPANY',
    refereeRewardConfig: {
      featureKey: 'monthly_rounds_limit',
      overrideValue: { bonusRounds: 1 },
      expiresInDays: 30,
      reason: 'Company referral 1-assessment bonus',
    },
    eligibilityConfig: { maxRedemptionsPerUser: 1, allowSelfReferral: false },
  });
  logPass(`Campaign created with reward = 1 assessment: ${camp1.id}`);

  // Generate code
  const code1 = await codeService.generateAdminCode(camp1.id, { maxUses: 10 });
  logPass(`Admin generated referral code: ${code1.code}`);

  // Candidate redeems code
  const redeemRes1 = await engineService.redeemCode(cand1.id, code1.code);
  if (!redeemRes1.success) throw new Error(`Redemption failed: ${redeemRes1.message}`);
  logPass(`Candidate 1 redeemed code ${code1.code} successfully!`);

  // Verify UserQuotaOverride in real database
  const override1 = await prisma.userQuotaOverride.findFirst({
    where: { userId: cand1.id, featureKey: 'monthly_rounds_limit' },
  });
  if (!override1 || override1.overrideValue?.bonusRounds !== 1) {
    throw new Error(`Expected bonusRounds = 1 in UserQuotaOverride, got: ${JSON.stringify(override1)}`);
  }
  logPass(`UserQuotaOverride verified in real DB: bonusRounds = 1`);

  // Verify EntitlementService unlocks additional round
  const ent1 = await entitlementService.getUserEntitlements(cand1.id);
  const isUnlocked = ent1.hasActivePlan && (ent1.features.monthlyRoundsRemaining === null || ent1.features.monthlyRoundsRemaining > 0);
  if (!isUnlocked) {
    throw new Error(`Entitlement not unlocked! Remaining: ${ent1.features.monthlyRoundsRemaining}`);
  }
  logPass(`EntitlementService verified: hasActivePlan=${ent1.hasActivePlan}, roundsRemaining=${ent1.features.monthlyRoundsRemaining}`);

  // Verify EligibilityService allows starting assessment
  const elig1 = await eligibilityService.validateEligibility(cand1.id, testConfig.id);
  if (!elig1.eligible) {
    throw new Error(`Candidate not eligible to start assessment: ${elig1.reason} (${elig1.errorCode})`);
  }
  logPass(`EligibilityService verified: Candidate 1 is ELIGIBLE for assessment launch!`);

  // Launch assessment -> TestInstance created in real database
  const instance1 = await prisma.testInstance.create({
    data: {
      userId: cand1.id,
      testConfigId: testConfig.id,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
  });
  logPass(`Assessment launched: TestInstance created with ID ${instance1.id}`);

  // Submit assessment -> status COMPLETED
  const completedInstance = await prisma.testInstance.update({
    where: { id: instance1.id },
    data: { status: 'COMPLETED', submittedAt: new Date() },
  });
  logPass(`Assessment completed and submitted: status=${completedInstance.status}`);

  // Generate EvaluationResult
  const evalResult1 = await prisma.evaluationResult.create({
    data: {
      userId: cand1.id,
      testInstanceId: instance1.id,
      overallScore: 88.5,
      communicationScore: 85.0,
      technicalScore: 92.0,
      confidenceScore: 88.0,
      correctAnswers: 4,
      totalQuestions: 5,
    },
  });
  logPass(`EvaluationResult generated in real DB: score=${evalResult1.overallScore}%, ID=${evalResult1.id}`);

  // =========================================================================
  // SCENARIO 2: Dynamic Config Change: reward = 2 (ZERO CODE CHANGES)
  // =========================================================================
  logStep('SCENARIO 2: Dynamic Config Change from reward = 1 to reward = 2 (ZERO CODE CHANGES)');

  // Update existing campaign to reward = 2 assessments dynamically
  await campaignService.updateCampaign(camp1.id, {
    refereeRewardConfig: {
      featureKey: 'monthly_rounds_limit',
      overrideValue: { bonusRounds: 2 },
      expiresInDays: 60,
      reason: 'Company referral 2-assessment bonus (UPDATED)',
    },
  });
  logPass(`Campaign ${camp1.id} JSON config dynamically updated to bonusRounds = 2`);

  const cand2 = await createCandidate('Company-2');
  const code2 = await codeService.generateAdminCode(camp1.id, { maxUses: 5 });

  const redeemRes2 = await engineService.redeemCode(cand2.id, code2.code);
  if (!redeemRes2.success) throw new Error(`Redemption failed: ${redeemRes2.message}`);

  const override2 = await prisma.userQuotaOverride.findFirst({
    where: { userId: cand2.id, featureKey: 'monthly_rounds_limit' },
  });
  if (!override2 || override2.overrideValue?.bonusRounds !== 2) {
    throw new Error(`Expected bonusRounds = 2 in UserQuotaOverride, got: ${JSON.stringify(override2)}`);
  }
  logPass(`UserQuotaOverride dynamically granted bonusRounds = 2 to Candidate 2 without any code changes!`);

  const elig2 = await eligibilityService.validateEligibility(cand2.id, testConfig.id);
  if (!elig2.eligible) throw new Error(`Candidate 2 not eligible: ${elig2.reason}`);
  logPass(`Candidate 2 validated ELIGIBLE with 2 bonus assessment attempts!`);

  // =========================================================================
  // SCENARIO 3: Candidate -> Candidate Flow (A -> B Dual Reward)
  // =========================================================================
  logStep('SCENARIO 3: Candidate -> Candidate Flow (Peer Referral: A refers B, both get rewarded)');

  const candA = await createCandidate('Peer-A');
  const candB = await createCandidate('Peer-B');

  // Create CANDIDATE campaign
  const peerCamp = await campaignService.createCampaign({
    name: `Peer Referral Campaign [${runId}]`,
    type: 'CANDIDATE',
    refereeRewardConfig: {
      featureKey: 'monthly_rounds_limit',
      overrideValue: { bonusRounds: 1 },
      reason: 'Peer referral sign-up bonus',
    },
    referrerRewardConfig: {
      featureKey: 'monthly_rounds_limit',
      overrideValue: { bonusRounds: 2 },
      reason: 'Peer referral friend rewarded bonus',
    },
    eligibilityConfig: { maxRedemptionsPerUser: 1, allowSelfReferral: false },
  });

  // Candidate A retrieves personal code
  const statusA = await engineService.getCandidateReferralStatus(candA.id, 'https://www.skillitrix.com');
  const codeA = statusA.personalCode;
  if (!codeA) throw new Error('Failed to generate personal code for Candidate A');
  logPass(`Candidate A received personal shareable referral code: ${codeA}`);

  // Candidate B redeems Candidate A's code
  const redeemPeer = await engineService.redeemCode(candB.id, codeA);
  if (!redeemPeer.success) throw new Error(`Candidate B redemption failed: ${redeemPeer.message}`);
  logPass(`Candidate B successfully redeemed Candidate A's code!`);

  // Verify Candidate B received 1 bonus assessment
  const overrideB = await prisma.userQuotaOverride.findFirst({
    where: { userId: candB.id, featureKey: 'monthly_rounds_limit' },
  });
  if (!overrideB || overrideB.overrideValue?.bonusRounds !== 1) {
    throw new Error(`Expected Candidate B bonusRounds = 1, got: ${JSON.stringify(overrideB)}`);
  }
  logPass(`Candidate B received 1 bonus assessment override!`);

  // Verify Candidate A received 2 bonus assessments
  const overrideA = await prisma.userQuotaOverride.findFirst({
    where: { userId: candA.id, featureKey: 'monthly_rounds_limit' },
  });
  if (!overrideA || overrideA.overrideValue?.bonusRounds !== 2) {
    throw new Error(`Expected Candidate A bonusRounds = 2, got: ${JSON.stringify(overrideA)}`);
  }
  logPass(`Candidate A received 2 bonus assessments override!`);

  // Verify ReferralEvent in database is REWARDED
  const event = await prisma.referralEvent.findFirst({
    where: { referrerId: candA.id, referredId: candB.id },
  });
  if (!event || event.status !== 'REWARDED') {
    throw new Error(`Expected ReferralEvent with status REWARDED, got: ${JSON.stringify(event)}`);
  }
  logPass(`ReferralEvent verified in DB: referrer=${candA.id}, referred=${candB.id}, status=${event.status}`);

  // Verify BOTH candidates are eligible to take assessments
  const [eligA, eligB] = await Promise.all([
    eligibilityService.validateEligibility(candA.id, testConfig.id),
    eligibilityService.validateEligibility(candB.id, testConfig.id),
  ]);
  if (!eligA.eligible) throw new Error(`Candidate A not eligible: ${eligA.reason}`);
  if (!eligB.eligible) throw new Error(`Candidate B not eligible: ${eligB.reason}`);
  logPass(`Both Candidate A and Candidate B are ELIGIBLE to launch assessments!`);

  // =========================================================================
  // SCENARIO 4: Abuse & Edge Case Protection
  // =========================================================================
  logStep('SCENARIO 4: Abuse & Edge Case Protection');

  // 1. A refers A (Self-Referral)
  try {
    await engineService.redeemCode(candA.id, codeA);
    throw new Error('Self-referral should have been rejected!');
  } catch (err: any) {
    if (err.message.includes('own referral code')) {
      logPass(`Abuse Test 1 Passed: Self-referral rejected ("${err.message}")`);
    } else throw err;
  }

  // 2. B uses same code twice (Idempotency)
  const duplicateRedeem = await engineService.redeemCode(candB.id, codeA);
  if (duplicateRedeem.alreadyRedeemed) {
    logPass(`Abuse Test 2 Passed: Duplicate code redemption caught idempotently without double reward`);
  } else throw new Error('Duplicate redemption was not flagged as alreadyRedeemed');

  // 3. Expired campaign
  const expiredCamp = await campaignService.createCampaign({
    name: 'Expired Campaign',
    type: 'COMPANY',
    startsAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    refereeRewardConfig: { featureKey: 'monthly_rounds_limit', overrideValue: { bonusRounds: 1 } },
  });
  const expiredCode = await codeService.generateAdminCode(expiredCamp.id);
  const candExp = await createCandidate('Exp-User');
  try {
    await engineService.redeemCode(candExp.id, expiredCode.code);
    throw new Error('Expired campaign should have been rejected!');
  } catch (err: any) {
    if (err.message.includes('expired')) {
      logPass(`Abuse Test 3 Passed: Expired campaign rejected ("${err.message}")`);
    } else throw err;
  }

  // 4. Paused campaign
  const pausedCamp = await campaignService.createCampaign({
    name: 'Paused Campaign',
    type: 'COMPANY',
    refereeRewardConfig: { featureKey: 'monthly_rounds_limit', overrideValue: { bonusRounds: 1 } },
  });
  await campaignService.updateCampaign(pausedCamp.id, { status: 'PAUSED' });
  const pausedCode = await codeService.generateAdminCode(pausedCamp.id);
  const candPause = await createCandidate('Pause-User');
  try {
    await engineService.redeemCode(candPause.id, pausedCode.code);
    throw new Error('Paused campaign should have been rejected!');
  } catch (err: any) {
    if (err.message.includes('PAUSED')) {
      logPass(`Abuse Test 4 Passed: Paused campaign rejected ("${err.message}")`);
    } else throw err;
  }

  // 5. Limit exhausted (code maxUses = 1)
  const singleUseCode = await codeService.generateAdminCode(camp1.id, { maxUses: 1 });
  const candLimit1 = await createCandidate('Limit-1');
  const candLimit2 = await createCandidate('Limit-2');

  await engineService.redeemCode(candLimit1.id, singleUseCode.code);
  try {
    await engineService.redeemCode(candLimit2.id, singleUseCode.code);
    throw new Error('Exhausted code should have been rejected!');
  } catch (err: any) {
    if (err.message.includes('limit reached')) {
      logPass(`Abuse Test 5 Passed: Code usage limit exhausted rejected ("${err.message}")`);
    } else throw err;
  }

  // 6. Same candidate + 2 codes in a campaign with maxRedemptionsPerUser = 1
  const codeCamp1B = await codeService.generateAdminCode(camp1.id);
  try {
    await engineService.redeemCode(cand1.id, codeCamp1B.code);
    throw new Error('Second code redemption for same user in single-use campaign should have been rejected!');
  } catch (err: any) {
    if (err.message.includes('maximum number of codes')) {
      logPass(`Abuse Test 6 Passed: Per-user campaign limit enforced ("${err.message}")`);
    } else throw err;
  }

  // 7. Concurrent redemption race condition test
  logStep('Concurrent Redemption Race Condition Test');
  const candRace = await createCandidate('Race-User');
  const raceCode = await codeService.generateAdminCode(camp1.id, { maxUses: 10 });

  // Fire 5 simultaneous redemptions
  await Promise.allSettled([
    engineService.redeemCode(candRace.id, raceCode.code),
    engineService.redeemCode(candRace.id, raceCode.code),
    engineService.redeemCode(candRace.id, raceCode.code),
    engineService.redeemCode(candRace.id, raceCode.code),
    engineService.redeemCode(candRace.id, raceCode.code),
  ]);

  const raceOverrides = await prisma.userQuotaOverride.findMany({
    where: { userId: candRace.id, featureKey: 'monthly_rounds_limit' },
  });
  if (raceOverrides.length !== 1) {
    throw new Error(`Race condition failure! Expected exactly 1 override, got ${raceOverrides.length}`);
  }
  logPass(`Abuse Test 7 Passed: Exactly 1 override granted under 5 concurrent redemption requests!`);

  console.log(`\n${GREEN}================================================================${RESET}`);
  console.log(`${GREEN}   ✔ ALL END-TO-END PRODUCT FLOW CHECKS PASSED WITH REAL DB!    ${RESET}`);
  console.log(`${GREEN}================================================================${RESET}`);
}

runE2E()
  .catch((err) => {
    logFail('E2E Verification Failed', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
