import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const ids = [
  'cmt411y5t00397gggnqeupbao',
  'cmt3x04cb0032nhc354buyw3a',
  'cmt3wzdz0002unhc3hmg4lcma',
  'cmt3wzxo90030nhc3hrmzslml',
  'cmt40shi5001o7gggj85p2t0z',
  'cmt3x1ekd003enhc3xwmbb176',
  'cmt40rogu00127ggggu3bjjkj',
  'cmt3x38in003wnhc3sy06c8sq',
  'cmt3x3luf0040nhc3f0kkxe5h',
  'cmt3x11dp003anhc3bgfxxsn8',
  'cmt40rwlz00187gggocn38dxo',
  'cmt3yco0q000hs8z1fe85usxp',
  'cmt3ychwh0009s8z15loi58q9',
  'cmt3wzkht002wnhc3rcu9ja49',
  'cmt40s6aq001g7gggkagmhwte',
  'cmt3ycd5o0003s8z1k6uovcbe',
  'cmt40rjm600107ggggovhofu9',
  'cmt3x3sd30042nhc3m93feh8r',
  'cmt40s8lh001i7gggay0tfehn',
  'cmt3x0auy0034nhc34gzvdad6',
  'cmt40sj3s001q7gggrlc2hd9d',
  'cmt40savq001k7gggg08x7fgv',
  'cmt3x2vbv003snhc3g0udax1f',
  'cmt4126xn003f7ggg0293tidc',
  'cmt411eyf002z7gggs3qqc6nn',
  'cmt40rzye001c7gggvdk6d0yz',
  'cmt412co3003h7gggy40ycb7k',
  'cmt3x2ot7003qnhc3rwnyjfn5',
  'cmt40sksa001s7gggs3dybiut',
  'cmt3x0upq0038nhc3cvp4rmtu',
  'cmt3x24xr003knhc3c52h3k1l',
  'cmt3x31zq003unhc308jsxu1k',
  'cmt3x3f6i003ynhc3pv3dxqfn',
  'cmt3x462p0046nhc3w7gjavvz',
  'cmt3x45jo0044nhc37d870ofg',
  'cmt3wzr5p002ynhc3g70unfha',
  'cmt40rs6800147ggg67jww50u',
  'cmt3ycma8000fs8z1mb1reypg',
  'cmt3x17wc003cnhc3c0kja3ez',
  'cmt3ycpth000js8z1ixocem8c',
  'cmt3x1l34003gnhc3zle25wob',
  'cmt40ruwj00167gggz3al39ww',
  'cmt3x0hiw0036nhc3yp0ik46o',
  'cmt40sff1001m7gggw27622q5',
  'cmt3ycja5000bs8z17og0cql5',
  'cmt3ycktt000ds8z1q3pbuies',
  'cmt3wz79b002snhc3bllvpit6',
  'cmt3x1yf3003inhc37zslhmk7',
  'cmt411vzw00377gggmh300k4a',
  'cmt4122n1003d7gggl1csprhh',
  'cmt40ry71001a7ggg9krex4sd',
  'cmt40s237001e7gggapd3m622',
  'cmt3x2i56003onhc3fks1vuoh',
  'cmt3ycgjb0007s8z1xixwip62',
  'cmt4120i6003b7ggg8tpd0gy7',
  'cmt411q2i00337gggbn6c9nh7',
  'cmt3x2bly003mnhc3g37o8bcy'
];

async function main() {
  const questions = await prisma.question.findMany({
    where: { id: { in: ids } }
  });

  const report: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const mcq: any = q.mcqData || {};
    const options: string[] = mcq.options || [];
    const answer = q.answer;
    const explanation = q.explanation || "";

    const itemIssues: string[] = [];

    // Check 1: Answer in options
    if (!options.includes(answer)) {
      itemIssues.push(`CRITICAL: Answer "${answer}" is NOT in options!`);
    }

    // Check 2: Unique options
    const uniqueOpts = new Set(options);
    if (uniqueOpts.size !== options.length) {
      itemIssues.push(`Duplicate options detected: ${options.length - uniqueOpts.size} duplicate(s)`);
    }

    // Check 3: Exactly 4 options
    if (options.length !== 4) {
      itemIssues.push(`Option count is ${options.length}, expected 4`);
    }

    report.push(`------------------------------------------------------------------------`);
    report.push(`[#${i + 1}] ID: ${q.id} | Difficulty: ${q.difficulty}`);
    report.push(`QUESTION: ${q.questionText}`);
    report.push(`OPTIONS:`);
    options.forEach((opt, idx) => {
      const isAns = opt === answer ? " [CORRECT]" : "";
      report.push(`  (${String.fromCharCode(65 + idx)}) ${opt}${isAns}`);
    });
    report.push(`EXPLANATION:\n${explanation}`);

    if (itemIssues.length > 0) {
      report.push(`ISSUES DETECTED:`);
      itemIssues.forEach(iss => report.push(`  - ${iss}`));
    }
  }

  fs.writeFileSync("sql-audit-utf8.txt", report.join("\n"), "utf-8");
  console.log(`Wrote audit of ${questions.length} questions to sql-audit-utf8.txt`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
