import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAllTopicTemplates() {
  console.log("=== CHECKING TOPIC & TEMPLATE COVERAGE ACROSS ENTIRE DB ===");
  const topics = await prisma.topic.findMany({
    include: { concepts: true }
  });

  const difficulties = ["EASY", "MEDIUM", "HARD"];

  for (const t of topics) {
    console.log(`\nTopic: ${t.name} (code: ${t.code})`);
    const conceptKeys = t.concepts.map(c => c.code);
    conceptKeys.push(t.code);

    for (const diff of difficulties) {
      const templates = await prisma.template.findMany({
        where: {
          conceptKey: { in: conceptKeys },
          difficultyLevel: diff as any,
          isActive: true
        }
      });
      if (templates.length === 0) {
        console.log(`  ❌ Missing active template for difficulty ${diff} (Concept keys: ${conceptKeys.join(", ")})`);
      } else {
        console.log(`  ✅ ${diff}: Found ${templates.length} templates (${templates.map(tmp => tmp.templateKey).join(", ")})`);
      }
    }
  }
}

checkAllTopicTemplates().catch(console.error).finally(() => prisma.$disconnect());
