import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Checking Readiness & Publish Status for TCS NQT Placement Assessment ===");

  const config = await prisma.examConfig.findFirst({
    where: { OR: [{ code: "TCS_NQT_PLACEMENT_ASSESSMENT" }, { name: { contains: "TCS NQT Placement Assessment" } }] },
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: { topic: true },
          },
        },
      },
      difficultyDistribution: true,
    },
  });

  if (!config) {
    console.log("Exam Configuration NOT FOUND in database.");
    return;
  }

  console.log(`\nExam Config Details:`);
  console.log(`- ID: ${config.id}`);
  console.log(`- Name: ${config.name}`);
  console.log(`- Code: ${config.code}`);
  console.log(`- Status: ${config.status}`);
  console.log(`- Total Questions: ${config.totalQuestions}`);
  console.log(`- Total Duration: ${config.totalDurationSeconds} seconds (${config.totalDurationSeconds / 60} mins)`);
  console.log(`- Total Sections: ${config.sections.length}`);

  // Check section totals
  const totalSectionQuestions = config.sections.reduce((acc, s) => acc + s.questionCount, 0);
  const totalSectionDuration = config.sections.reduce((acc, s) => acc + s.durationSeconds, 0);

  console.log(`\nSection Structure Check:`);
  console.log(`- Section Questions Sum: ${totalSectionQuestions} / ${config.totalQuestions} -> ${totalSectionQuestions === config.totalQuestions ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`- Section Duration Sum: ${totalSectionDuration} / ${config.totalDurationSeconds} -> ${totalSectionDuration === config.totalDurationSeconds ? "PASSED ✅" : "FAILED ❌"}`);

  // Audit Question Pool for every topic across all sections
  console.log(`\nQuestion Bank Topic Audit:`);
  let totalTopicChecks = 0;
  let passedTopicChecks = 0;

  for (const section of config.sections) {
    console.log(`\nSection: '${section.name}' (${section.questionCount} questions):`);
    for (const st of section.sectionTopics) {
      totalTopicChecks++;
      const reqCount = Math.round((st.percentage / 100) * section.questionCount);
      const totalAvailable = await prisma.question.count({
        where: {
          status: "ACTIVE",
          OR: [{ topicId: st.topic.id }, { topicId: st.topic.code }],
        },
      });

      const passed = totalAvailable >= reqCount;
      if (passed) passedTopicChecks++;
      console.log(`  - Topic '${st.topic.name}': Available ${totalAvailable} / Required ${reqCount} -> ${passed ? "PASSED ✅" : "FAILED ❌"}`);
    }
  }

  const overallReady = totalSectionQuestions === config.totalQuestions && totalSectionDuration === config.totalDurationSeconds && totalTopicChecks === passedTopicChecks;

  console.log(`\n======================================================`);
  console.log(`FINAL PUBLISH READINESS STATUS: ${overallReady ? "READY TO PUBLISH 🚀 (100% Passed)" : "NOT READY TO PUBLISH ❌"}`);
  console.log(`======================================================`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
