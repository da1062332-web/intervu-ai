import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configId = 'cmsifafam000099s9csfe33pg';
  console.log(`Testing validation prerequisites for config ${configId}...`);

  // 1. Config
  const config = await prisma.examConfig.findUnique({
    where: { id: configId },
  });
  console.log('1. Config found:', config?.name);

  // 2. Sections
  const sections = await prisma.examSection.findMany({
    where: { examConfigId: configId },
    include: {
      sectionTopics: {
        include: {
          topic: {
            include: {
              concepts: true,
            },
          },
          topicWeightage: true,
        },
      },
    },
  });
  console.log(`2. Sections count: ${sections.length}`);

  // 3. Rules
  const ruleFlags = await prisma.ruleFlags.findUnique({
    where: { examConfigId: configId },
  });
  console.log('3. Rule flags:', !!ruleFlags);

  // 4. Difficulty distribution
  const diffDist = await prisma.difficultyDistribution.findUnique({
    where: { examConfigId: configId },
  });
  console.log('4. Difficulty distribution:', diffDist);

  // 5. Blueprint
  const blueprint = await prisma.blueprint.findUnique({
    where: { configId },
  });
  console.log('5. Blueprint:', !!blueprint);

  if (blueprint) {
    console.log('   Blueprint styleProfileId:', blueprint.styleProfileId);
    console.log('   Blueprint sections type:', typeof blueprint.sections);
    const styleProfile = await prisma.styleProfile.findUnique({
      where: { id: blueprint.styleProfileId },
    });
    console.log('   Style profile found:', !!styleProfile);
  }

  // 6. Check Topic Weightages
  console.log('6. Checking section weightages:');
  for (const s of sections) {
    const sum = s.sectionTopics.reduce((acc, st) => acc + (st.topicWeightage?.weightagePercentage || 0), 0);
    console.log(`   Section "${s.name}": topics = ${s.sectionTopics.length}, weightage sum = ${sum}%`);
  }

  // 7. Check templates and variables / rules
  console.log('7. Checking templates...');
  const templates = await prisma.template.findMany({
    include: {
      variables: true,
      rules: true,
    },
  });
  console.log(`   Total templates: ${templates.length}`);

  for (const t of templates) {
    // Check solution template
    const sol = await prisma.solutionTemplate.findUnique({
      where: { templateId: t.id },
    });
    if (!sol && t.isActive) {
      // console.log(`   Template "${t.name}" (${t.id}) has NO solution template`);
    }
  }

  console.log('All queries executed without unhandled rejection.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
