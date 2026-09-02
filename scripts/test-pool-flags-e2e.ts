import { PrismaClient } from "@prisma/client";
import { RuleFlagsRepository } from "../apps/api/src/modules/rule-flags/repositories/rule-flags.repository";
import { RuleFlagsService } from "../apps/api/src/modules/rule-flags/services/rule-flags.service";

const prisma = new PrismaClient();

async function testPoolFlagsE2E() {
  const repo = new RuleFlagsRepository(prisma as any);
  const ruleFlagsService = new RuleFlagsService(repo);

  const config = await prisma.examConfig.findFirst({ where: { name: "TCS-NQT" } });
  if (!config) {
    console.error("Config not found");
    return;
  }

  console.log(`Updating pool settings for config "${config.name}" (${config.id})...`);
  const updated = await ruleFlagsService.updateRuleFlags(config.id, {
    negativeMarkingEnabled: false,
    sectionalCutoffEnabled: true,
    adaptiveDifficultyEnabled: false,
    shuffleQuestionsEnabled: true,
    shuffleOptionsEnabled: true,
    allowSectionNavigation: true,
    maxAttempts: 3,
    candidateNoRepeatEnabled: true,
    runtimeGenerationOnDeficit: true,
    poolEnabled: true,
    poolTargetSize: 15,
    poolMinThreshold: 4,
    poolRefillBatchSize: 6,
  });

  console.log("Updated Rule Flags with Dynamic Pool:", {
    poolEnabled: updated.poolEnabled,
    poolTargetSize: updated.poolTargetSize,
    poolMinThreshold: updated.poolMinThreshold,
    poolRefillBatchSize: updated.poolRefillBatchSize,
  });

  const fetched = await ruleFlagsService.getRuleFlags(config.id);
  console.log("Fetched Rule Flags from DB:", {
    poolEnabled: fetched.poolEnabled,
    poolTargetSize: fetched.poolTargetSize,
    poolMinThreshold: fetched.poolMinThreshold,
    poolRefillBatchSize: fetched.poolRefillBatchSize,
  });
}

testPoolFlagsE2E()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
