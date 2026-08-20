import { PrismaClient } from "@prisma/client";
import {
  normalizeDisplayQuestion,
  synthesizeNumericDistractors,
  isPlaceholderOptions,
} from "../src/modules/generation-ai/utils/display-value-formatter";

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING COMPREHENSIVE DB OPTIONS & PRECISION REMEDIATION ===");

  // 1. Patch Question table
  const questions = await prisma.question.findMany();
  let updatedQuestions = 0;

  for (const q of questions) {
    const isMcq =
      q.questionType === "MCQ" ||
      q.questionType === "MULTIPLE_CHOICE" ||
      !q.questionType;
    const mcqData = (q.mcqData as any) || {};
    let options = mcqData.options || (q as any).options || [];

    let needsPatch = false;

    // Check if options are missing or placeholder Option A-D
    if (
      isMcq &&
      (!Array.isArray(options) ||
        options.length === 0 ||
        isPlaceholderOptions(options))
    ) {
      needsPatch = true;
      const targetAns = q.answer || mcqData.correctAnswer;
      if (targetAns && !isNaN(Number(targetAns))) {
        options = synthesizeNumericDistractors(Number(targetAns), 4);
      }
    }

    // Normalize floats to clean 2-decimal presentation
    const normalized = normalizeDisplayQuestion({
      questionText: q.questionText,
      options,
      answer: q.answer,
      explanation: q.explanation,
    });

    const newAnswer = normalized.answer ? String(normalized.answer) : q.answer;
    const newOptions = normalized.options || options;

    if (
      needsPatch ||
      JSON.stringify(newOptions) !== JSON.stringify(options) ||
      newAnswer !== q.answer
    ) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          answer: newAnswer,
          mcqData: {
            ...mcqData,
            options: newOptions,
            correctAnswer: newAnswer,
          },
        },
      });
      updatedQuestions++;
    }
  }
  console.log(
    `Patched ${updatedQuestions}/${questions.length} Question records ✅`,
  );

  // 2. Patch GeneratedQuestion table
  const genQuestions = await prisma.generatedQuestion.findMany();
  let updatedGen = 0;

  for (const g of genQuestions) {
    let options = (g.options as any) || [];
    let needsPatch = false;

    if (
      !Array.isArray(options) ||
      options.length === 0 ||
      isPlaceholderOptions(options)
    ) {
      needsPatch = true;
      const targetAns = g.correctAnswer;
      if (targetAns && !isNaN(Number(targetAns))) {
        options = synthesizeNumericDistractors(Number(targetAns), 4);
      }
    }

    const normalized = normalizeDisplayQuestion({
      questionText: g.questionText,
      options,
      correctAnswer: g.correctAnswer,
      explanation: g.solution,
    });

    const newCorrectAnswer = normalized.correctAnswer
      ? String(normalized.correctAnswer)
      : g.correctAnswer;
    const newOptions = normalized.options || options;

    if (
      needsPatch ||
      JSON.stringify(newOptions) !== JSON.stringify(options) ||
      newCorrectAnswer !== g.correctAnswer
    ) {
      await prisma.generatedQuestion.update({
        where: { id: g.id },
        data: {
          options: newOptions,
          correctAnswer: newCorrectAnswer,
        },
      });
      updatedGen++;
    }
  }
  console.log(
    `Patched ${updatedGen}/${genQuestions.length} GeneratedQuestion records ✅`,
  );

  // 3. Patch TestInstanceQuestion snapshots
  const tiqs = await prisma.testInstanceQuestion.findMany();
  let updatedTiqs = 0;

  for (const tiq of tiqs) {
    const snap = (tiq.questionSnapshot as any) || {};
    let options = snap.options || snap.mcqData?.options || [];
    let needsPatch = false;

    const rawAns = snap.answer ?? snap.correctAnswer;
    if (
      !Array.isArray(options) ||
      options.length === 0 ||
      isPlaceholderOptions(options)
    ) {
      needsPatch = true;
      if (rawAns && !isNaN(Number(rawAns))) {
        options = synthesizeNumericDistractors(Number(rawAns), 4);
      }
    }

    const normalized = normalizeDisplayQuestion({
      questionText: snap.questionText || snap.question || snap.text,
      options,
      answer: rawAns,
      explanation: snap.explanation || snap.solution,
    });

    const newOptions = normalized.options || options;
    const newAns = normalized.answer ? String(normalized.answer) : rawAns;

    if (needsPatch || JSON.stringify(newOptions) !== JSON.stringify(options)) {
      const updatedSnap = {
        ...snap,
        options: newOptions,
        answer: newAns,
        correctAnswer: newAns,
        mcqData: {
          ...(snap.mcqData || {}),
          options: newOptions,
          correctAnswer: newAns,
        },
      };

      await prisma.testInstanceQuestion.update({
        where: { id: tiq.id },
        data: { questionSnapshot: updatedSnap },
      });
      updatedTiqs++;
    }
  }
  console.log(
    `Patched ${updatedTiqs}/${tiqs.length} TestInstanceQuestion snapshots ✅`,
  );

  console.log("=== ALL OPTIONS & PRECISION REMEDIATION COMPLETE ===");
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
