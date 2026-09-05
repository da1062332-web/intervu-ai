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
              topic: true
            }
          }
        }
      }
    }
  });

  if (!config) {
    console.log('ExamConfig not found.');
    return;
  }

  console.log(`Config: ${config.name}`);
  for (const sec of config.sections) {
    console.log(`\nSection: ${sec.name}`);
    for (const st of sec.sectionTopics) {
       console.log(`  - Topic: ${st.topic.name}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
