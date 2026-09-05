import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.examConfig.findUnique({
    where: { id: 'cmsifafam000099s9csfe33pg' },
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: {
              topic: {
                include: {
                  concepts: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!config) return;

  for (const sec of config.sections) {
    console.log(`\nSection: ${sec.name}`);
    for (const st of sec.sectionTopics) {
      const topic = st.topic;
      // In this DB, Templates usually map to Concept codes, but sometimes directly to Topic codes
      const conceptCodes = topic.concepts.map(c => c.code);
      const keysToCheck = [topic.code, ...conceptCodes];
      
      const hardTemplates = await prisma.template.count({
        where: {
          conceptKey: { in: keysToCheck },
          difficultyLevel: 'HARD',
          isActive: true,
          deletedAt: null
        }
      });

      if (hardTemplates === 0) {
        console.log(`  [NO HARD TEMPLATES] Topic: ${topic.name}`);
      } else {
        console.log(`  [HAS HARD] Topic: ${topic.name} (${hardTemplates} templates)`);
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
