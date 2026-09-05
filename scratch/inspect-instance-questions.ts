import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const instanceId = 'cmtnys8t2003xzolo1fcb6uq2';
  const instance = await prisma.testInstance.findUnique({
    where: { id: instanceId },
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });

  if (!instance) {
    console.log('Instance not found');
    return;
  }

  console.log(`Inspecting test instance ${instance.id} (${instance.sections.length} sections):`);
  let issuesFound = 0;

  for (const sec of instance.sections) {
    console.log(`\n--- Section: ${sec.sectionName} (${sec.questions.length} questions) ---`);
    for (const q of sec.questions) {
      const snap = (q.questionSnapshot as any) || {};
      
      // Mimic the getOptionsList and extractOptionText logic from frontend
      const getOptionsList = (sq: any): any[] => {
        if (Array.isArray(sq.options) && sq.options.length > 0) return sq.options;
        if (Array.isArray(sq.mcqData?.options) && sq.mcqData.options.length > 0) return sq.mcqData.options;
        if (Array.isArray(sq.mcqData?.choices) && sq.mcqData.choices.length > 0) return sq.mcqData.choices;
        if (Array.isArray(sq.metadata?.options) && sq.metadata.options.length > 0) return sq.metadata.options;
        if (Array.isArray(sq.metadata?.choices) && sq.metadata.choices.length > 0) return sq.metadata.choices;
        if (Array.isArray(sq.choices) && sq.choices.length > 0) return sq.choices;
        return [];
      };

      const extractOptionText = (option: any): string => {
        if (option === null || option === undefined) return '';
        if (typeof option === 'string') return option;
        if (typeof option === 'number' || typeof option === 'boolean') return String(option);
        if (typeof option === 'object') {
          if (typeof option.text === 'string') return option.text;
          if (typeof option.value === 'string') return option.value;
          if (typeof option.label === 'string') return option.label;
          if (typeof option.optionText === 'string') return option.optionText;
          if (typeof option.option === 'string') return option.option;
          if (typeof option.content === 'string') return option.content;
          if (typeof option.statement === 'string') return option.statement;
          if (typeof option.text === 'object' && option.text !== null) return extractOptionText(option.text);
          if (typeof option.value === 'object' && option.value !== null) return extractOptionText(option.value);
          for (const key of ['text', 'value', 'label', 'option', 'content', 'title', 'description']) {
            if (typeof option[key] === 'string') return option[key];
          }
          for (const [k, v] of Object.entries(option)) {
            if (k !== 'id' && k !== 'isCorrect' && typeof v === 'string' && v.trim() !== '') {
              return v;
            }
          }
        }
        const str = String(option);
        return str === '[object Object]' ? '' : str;
      };

      const opts = getOptionsList(snap);
      const qType = String(snap.questionType || snap.type || 'MCQ').toUpperCase();
      const isCoding = qType === 'CODING' || sec.sectionName.toLowerCase().includes('coding');

      if (!isCoding) {
        if (opts.length === 0) {
          issuesFound++;
          console.log(`❌ Q#${q.questionOrder} (ID: ${q.questionId}) Type: ${qType} HAS 0 OPTIONS!`);
          console.log(`   Text: "${snap.questionText || snap.questionStatement || snap.stem}"`);
          console.log(`   Snapshot keys:`, Object.keys(snap));
          console.log(`   Raw Snapshot:`, JSON.stringify(snap));
        } else {
          // Check if any option text is empty or blank
          const formattedOpts = opts.map(o => extractOptionText(o));
          const hasBlank = formattedOpts.some(t => !t || t.trim().length === 0);
          if (hasBlank) {
            issuesFound++;
            console.log(`⚠️ Q#${q.questionOrder} (ID: ${q.questionId}) HAS BLANK OPTIONS!`);
            console.log(`   Formatted:`, formattedOpts);
            console.log(`   Raw opts:`, opts);
          }
        }
      }
    }
  }

  console.log(`\nTotal questions with option issues: ${issuesFound}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
