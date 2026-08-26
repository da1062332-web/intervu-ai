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

  console.log(`Auditing all ${questions.length} questions in detail...\n`);

  const flawedQuestions: any[] = [];
  const validQuestions: any[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const mcq: any = q.mcqData || {};
    const options: string[] = mcq.options || [];
    const answer = q.answer;
    const explanation = q.explanation || "";

    const bugs: string[] = [];

    // 1. Check if answer matches options
    const ansIdx = options.indexOf(answer);
    if (ansIdx === -1) {
      bugs.push(`Answer "${answer}" not found in options list`);
    }

    // 2. Check if explanation refers to completely different text/words
    const allOptionsText = options.join(" ").toLowerCase();
    const answerText = answer.toLowerCase();
    const explanationLower = explanation.toLowerCase();

    // Check key topic alignment in explanation
    // Extract phrases in single or double quotes in explanation
    const quotedPhrases = (explanation.match(/['"“‘]([^'"”’]+)['"”’]/g) || [])
      .map(p => p.replace(/['"“‘”’]/g, "").trim().toLowerCase())
      .filter(p => p.length > 5);

    let hasQuotedMatch = quotedPhrases.length === 0;
    for (const qp of quotedPhrases) {
      if (allOptionsText.includes(qp) || answerText.includes(qp)) {
        hasQuotedMatch = true;
        break;
      }
    }

    // Heuristic: check if explanation mentions quotes that don't appear anywhere in options or answer
    const foreignQuotes = quotedPhrases.filter(qp => 
      !allOptionsText.includes(qp) && 
      !answerText.includes(qp) &&
      !qp.includes("option") &&
      !qp.includes("step") &&
      !qp.includes("concept") &&
      !qp.includes("reasoning")
    );

    if (foreignQuotes.length >= 2) {
      bugs.push(`Mismatched explanation: discusses unrelated text like: ${foreignQuotes.slice(0, 3).map(s => `"${s}"`).join(", ")}`);
    }

    // 3. Check option letter reference in explanation
    const optionLetterMatch = explanation.match(/option\s+([A-D]|1-4)/i);
    if (optionLetterMatch && ansIdx !== -1) {
      const stated = optionLetterMatch[1].toUpperCase();
      let statedIdx = -1;
      if (stated === "A" || stated === "1") statedIdx = 0;
      else if (stated === "B" || stated === "2") statedIdx = 1;
      else if (stated === "C" || stated === "3") statedIdx = 2;
      else if (stated === "D" || stated === "4") statedIdx = 3;

      if (statedIdx !== -1 && statedIdx !== ansIdx) {
        bugs.push(`Option letter mismatch in explanation: states option ${stated} (index ${statedIdx}) but correct answer is at option ${String.fromCharCode(65 + ansIdx)} (index ${ansIdx})`);
      }
    }

    // 4. Check for duplicate questions / duplicate options
    if (new Set(options).size !== options.length) {
      bugs.push(`Duplicate options inside the question`);
    }

    if (bugs.length > 0) {
      flawedQuestions.push({
        num: i + 1,
        id: q.id,
        difficulty: q.difficulty,
        question: q.questionText,
        options,
        answer,
        explanation,
        bugs
      });
    } else {
      validQuestions.push({
        num: i + 1,
        id: q.id,
        difficulty: q.difficulty,
        question: q.questionText,
        answer
      });
    }
  }

  console.log(`=== SUMMARY OF AUDIT ===`);
  console.log(`Total questions analyzed: ${questions.length}`);
  console.log(`Total questions with bugs/mismatches: ${flawedQuestions.length}`);
  console.log(`Total valid questions: ${validQuestions.length}\n`);

  fs.writeFileSync("flawed-questions-report.json", JSON.stringify(flawedQuestions, null, 2), "utf-8");
  console.log(`Wrote flawed questions report to flawed-questions-report.json`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
