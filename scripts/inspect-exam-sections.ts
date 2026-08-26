import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectExamSections() {
  const ec = await prisma.examConfig.findUnique({
    where: { id: "cmsyfqxso0010zertz7dwxydp" },
    include: {
      sections: {
        include: {
          sectionTopics: true,
          blueprintTopicConfigs: true
        }
      }
    }
  });

  console.log("ExamConfig:", ec?.name);
  for (const s of (ec?.sections || [])) {
    console.log("------------------------------------------");
    console.log(`Section: ${s.name} (${s.id})`);
    console.log("  Order:", s.orderIndex);
    console.log("  Total Questions:", s.totalQuestions);
    console.log("  Duration:", s.duration);
    console.log("  SectionTopics:", JSON.stringify(s.sectionTopics, null, 2));
    console.log("  BlueprintTopicConfigs:", JSON.stringify(s.blueprintTopicConfigs, null, 2));
  }
}

inspectExamSections().catch(console.error).finally(() => prisma.$disconnect());
