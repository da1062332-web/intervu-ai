import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// Load env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const parts = trimmedLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      process.env[key] = val;
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('--- DB MATCHING DIAGNOSTIC START ---');
  
  // 1. Get all templates and their concept keys and difficulties
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    select: {
      conceptKey: true,
      difficultyLevel: true,
    }
  });
  console.log('\nActive Templates in DB:');
  const templateMap: Record<string, string[]> = {};
  templates.forEach(t => {
    if (!templateMap[t.conceptKey]) {
      templateMap[t.conceptKey] = [];
    }
    templateMap[t.conceptKey].push(t.difficultyLevel);
  });
  Object.entries(templateMap).forEach(([concept, diffs]) => {
    console.log(`- Concept: "${concept}" has difficulties: ${[...new Set(diffs)].join(', ')}`);
  });

  // 2. Find concepts and their topics
  const concepts = await prisma.concept.findMany({
    include: { topic: true }
  });
  const conceptToTopicMap: Record<string, { topicId: string, topicName: string }> = {};
  concepts.forEach(c => {
    conceptToTopicMap[c.code] = {
      topicId: c.topicId,
      topicName: c.topic?.name || 'Unnamed Topic'
    };
  });

  // 3. Find all ExamConfigs, their sections, and section topics
  const configs = await prisma.examConfig.findMany({
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

  console.log('\nExam Configs, Sections, and Topics:');
  configs.forEach(c => {
    console.log(`\nConfig Name: "${c.name}", ID: "${c.id}"`);
    c.sections.forEach(s => {
      console.log(`  * Section Name: "${s.name}", ID: "${s.id}", Question Count: ${s.questionCount}`);
      s.sectionTopics.forEach(st => {
        console.log(`    + Topic Name: "${st.topic?.name || 'Unnamed'}", ID: "${st.topicId}"`);
        
        // Find if this topic has any concepts with templates
        const matchingConcepts = concepts.filter(con => con.topicId === st.topicId);
        matchingConcepts.forEach(mc => {
          const templatesForConcept = templateMap[mc.code] || [];
          if (templatesForConcept.length > 0) {
            console.log(`      -> Match! Concept "${mc.code}" has templates with difficulties: ${[...new Set(templatesForConcept)].join(', ')}`);
          }
        });
      });
    });
  });

  console.log('--- DB MATCHING DIAGNOSTIC END ---');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
