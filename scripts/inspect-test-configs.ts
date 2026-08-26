import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectTestConfigs() {
  const configs = await prisma.testConfig.findMany({
    include: {
      sections: true
    }
  });

  console.log(`Found ${configs.length} TestConfigs:`);

  for (const tc of configs) {
    console.log("==========================================");
    console.log("TestConfig ID:", tc.id);
    console.log("Name:", tc.name);
    console.log("Sections count:", tc.sections.length);
    for (const sec of tc.sections) {
      console.log(`  Section: ${sec.name} (${sec.sectionKey})`);
      console.log(`    Total Questions: ${sec.totalQuestions}`);
      console.log(`    Config:`, JSON.stringify(sec.config, null, 2));
    }
  }

  // Also check ExamConfig if any
  try {
    const examConfigs = await (prisma as any).examConfig.findMany({
      include: { sections: true }
    });
    console.log(`\nFound ${examConfigs?.length || 0} ExamConfigs:`);
    for (const ec of examConfigs || []) {
      console.log("==========================================");
      console.log("ExamConfig ID:", ec.id);
      console.log("Name:", ec.name);
      for (const s of ec.sections || []) {
        console.log(`  Section: ${s.name} (${s.sectionKey}) - Questions: ${s.totalQuestions}`);
        console.log(`  Config:`, JSON.stringify(s.config, null, 2));
      }
    }
  } catch (e) {}
}

inspectTestConfigs().catch(console.error).finally(() => prisma.$disconnect());
