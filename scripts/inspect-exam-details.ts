import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectExamConfigDetails() {
  const ec = await prisma.examConfig.findUnique({
    where: { id: "cmsyfqxso0010zertz7dwxydp" },
    include: {
      sections: {
        include: {
          blueprints: true
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
    console.log("  Blueprints:", JSON.stringify(s.blueprints, null, 2));
  }
}

inspectExamConfigDetails().catch(console.error).finally(() => prisma.$disconnect());
