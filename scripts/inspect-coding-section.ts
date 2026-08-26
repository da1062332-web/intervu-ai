import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectCodingSection() {
  const ec = await prisma.examConfig.findUnique({
    where: { id: "cmsyfqxso0010zertz7dwxydp" },
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: { topic: true }
          }
        }
      }
    }
  });

  const codingSection = ec?.sections.find(s => s.name.toLowerCase().includes("coding"));
  console.log("Coding Section ID:", codingSection?.id);
  console.log("Coding Section Name:", codingSection?.name);
  console.log("Coding Section sectionTopics:");
  for (const st of (codingSection?.sectionTopics || [])) {
    console.log(`  Topic: ${st.topic?.name} (${st.topicId})`);
  }

  // Let's check the questions belonging to these topics
  for (const st of (codingSection?.sectionTopics || [])) {
    const qs = await prisma.question.findMany({
      where: { topicId: st.topicId }
    });
    console.log(`\nTopic "${st.topic?.name}" has ${qs.length} questions in Question table:`);
    for (const q of qs) {
      console.log(`  - ID: ${q.id} | Type: ${q.questionType} | Title: ${q.questionTitle} | Text: ${(q.questionText || "").substring(0, 40)}`);
    }
  }
}

inspectCodingSection().catch(console.error).finally(() => prisma.$disconnect());
