import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=========================================================================");
  console.log("=== FULL READINESS & PUBLISH AUDIT: TCS NQT PLACEMENT ASSESSMENT ===");
  console.log("=========================================================================\n");

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
    console.log("❌ ERROR: Exam Configuration not found in database.");
    return;
  }

  console.log(`📋 Config Details:`);
  console.log(`- Config Name: ${config.name}`);
  console.log(`- Config Code: ${config.code}`);
  console.log(`- ID: ${config.id}`);
  console.log(`- Status: ${config.status}`);
  console.log(`- Total Questions: ${config.totalQuestions}`);
  console.log(`- Duration: ${config.durationMinutes} minutes`);
  console.log(`- Total Sections: ${config.sections.length}`);

  // 1. Structure Audit
  const totalSectionQuestions = config.sections.reduce((acc, s) => acc + s.questionCount, 0);
  const totalSectionDuration = config.sections.reduce((acc, s) => acc + s.sectionDurationMinutes, 0);

  const questionsMatch = totalSectionQuestions === config.totalQuestions;
  const durationMatch = totalSectionDuration === config.durationMinutes;

  console.log(`\n1️⃣ Section Structure Audit:`);
  console.log(`- Questions: ${totalSectionQuestions} / ${config.totalQuestions} -> ${questionsMatch ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`- Duration: ${totalSectionDuration} mins / ${config.durationMinutes} mins -> ${durationMatch ? "PASSED ✅" : "FAILED ❌"}`);

  // 2. Question Bank Audit per Topic
  console.log(`\n2️⃣ Question Bank Capacity Audit per Topic:`);
  let allTopicsPassed = true;

  for (const section of config.sections) {
    console.log(`\n📂 Section: '${section.name}' (${section.questionCount} Qs, ${section.sectionDurationMinutes} mins):`);
    const topicCount = section.sectionTopics.length;
    const questionsPerTopic = topicCount > 0 ? Math.ceil(section.questionCount / topicCount) : 0;

    for (const st of section.sectionTopics) {
      const topicName = st.topic.name;
      const topicId = st.topic.id;
      const topicCode = st.topic.code;

      const activeCount = await prisma.question.count({
        where: {
          status: "ACTIVE",
          OR: [{ topicId: topicId }, { topicId: topicCode }],
        },
      });

      const isTopicPassed = activeCount >= questionsPerTopic;
      if (!isTopicPassed) allTopicsPassed = false;

      console.log(`  • Topic '${topicName}': Available = ${activeCount}, Required = ${questionsPerTopic} -> ${isTopicPassed ? "PASSED ✅" : "FAILED ❌"}`);
    }
  }

  // 3. Difficulty Distribution Check
  console.log(`\n3️⃣ Difficulty Distribution Audit:`);
  if (config.difficultyDistribution && config.difficultyDistribution.length > 0) {
    for (const dd of config.difficultyDistribution) {
      console.log(`- Easy: ${dd.easyPercentage}%, Medium: ${dd.mediumPercentage}%, Hard: ${dd.hardPercentage}%`);
    }
  } else {
    console.log(`- Standard Dynamic Allocation Mode Active.`);
  }

  const isPublishReady = questionsMatch && durationMatch && allTopicsPassed;

  console.log(`\n=========================================================================`);
  console.log(`🎯 OVERALL PUBLISH READINESS STATUS:`);
  if (isPublishReady) {
    console.log(`✅ READY TO PUBLISH! (100% Passed across all 5 sections & 16 topics)`);
  } else {
    console.log(`❌ NOT READY TO PUBLISH. Please review the failed checks above.`);
  }
  console.log(`=========================================================================\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
