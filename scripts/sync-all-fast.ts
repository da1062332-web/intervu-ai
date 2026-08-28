import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncAllFast() {
  console.log("==================================================");
  console.log("FAST PARALLEL SNAPSHOT & ANSWER SYNCHRONIZATION");
  console.log("==================================================");

  // 1. Build fast lookup maps from Question table
  const allBankQuestions = await prisma.question.findMany();
  const bankById = new Map(allBankQuestions.map(q => [q.id, q]));
  const bankByHash = new Map(allBankQuestions.map(q => [q.questionHash || q.id, q]));
  const bankByText = new Map(allBankQuestions.map(q => [q.questionText.trim().toLowerCase(), q]));

  // 2. Build fast lookup maps from GeneratedQuestion table
  const allGenQuestions = await prisma.generatedQuestion.findMany();
  const genById = new Map(allGenQuestions.map(q => [q.id, q]));
  const genByHash = new Map(allGenQuestions.map(q => [q.questionHash, q]));
  const genByText = new Map(allGenQuestions.map(q => [q.questionText.trim().toLowerCase(), q]));

  console.log(`Loaded ${allBankQuestions.length} bank questions and ${allGenQuestions.length} generated questions.`);

  function enrichSnapshot(snap: any, qid: string) {
    const hash = snap.questionHash || qid;
    const text = (snap.questionText || "").trim().toLowerCase();

    const bankQ = bankById.get(qid) || bankByHash.get(hash) || bankByText.get(text);
    const genQ = genById.get(qid) || genByHash.get(hash) || genByText.get(text);

    let answer = snap.answer || snap.correctAnswer || snap.metadata?.answer || snap.mcqData?.correctAnswer || snap.expectedAnswer;
    let options = snap.options || snap.mcqData?.options || snap.metadata?.options || [];
    let isCoding = snap.questionType === "CODING" || !!snap.codingData || bankQ?.questionType === "CODING";

    const newSnap = { ...snap };
    newSnap.metadata = { ...(newSnap.metadata || {}) };

    if (bankQ) {
      const bankMeta = (bankQ.metadata || {}) as any;
      const bankMcq = (bankQ.mcqData || {}) as any;
      const bankCoding = (bankQ.codingData || {}) as any;

      if (bankQ.questionType === "CODING") {
        isCoding = true;
        newSnap.questionType = "CODING";
        newSnap.codingData = bankCoding;
        newSnap.metadata.starterCode = bankCoding.starterCode;
        newSnap.metadata.publicTests = bankCoding.publicTests;
        newSnap.metadata.hiddenTests = bankCoding.hiddenTests;
        newSnap.metadata.boundaryTests = bankCoding.boundaryTests;
        newSnap.metadata.stressTests = bankCoding.stressTests;
        newSnap.metadata.oracleKey = bankCoding.oracleKey || bankMeta.oracleKey;
      } else {
        const bankAns = bankQ.answer || bankMeta.answer || bankMcq.correctAnswer;
        if (bankAns) {
          answer = bankAns;
          newSnap.answer = bankAns;
          newSnap.metadata.answer = bankAns;
          if (!newSnap.mcqData) newSnap.mcqData = {};
          newSnap.mcqData.correctAnswer = bankAns;
        }
        if (bankMcq.options && Array.isArray(bankMcq.options) && bankMcq.options.length > 0) {
          options = bankMcq.options;
          newSnap.options = bankMcq.options;
          newSnap.metadata.options = bankMcq.options;
          if (!newSnap.mcqData) newSnap.mcqData = {};
          newSnap.mcqData.options = bankMcq.options;
        }
      }
    } else if (genQ) {
      const genMeta = (genQ.metadata || {}) as any;
      const genAns = (genQ.correctAnswer as any) || genMeta.datasetItem?.answer;
      if (genAns) {
        const ansStr = typeof genAns === "object" ? (genAns.text || genAns.value || JSON.stringify(genAns)) : String(genAns);
        answer = ansStr;
        newSnap.answer = ansStr;
        newSnap.metadata.answer = ansStr;
        if (!newSnap.mcqData) newSnap.mcqData = {};
        newSnap.mcqData.correctAnswer = ansStr;
      }
      if (Array.isArray(genQ.options) && genQ.options.length > 0) {
        options = genQ.options;
        newSnap.options = genQ.options;
        newSnap.metadata.options = genQ.options;
        if (!newSnap.mcqData) newSnap.mcqData = {};
        newSnap.mcqData.options = genQ.options;
      }
    }

    if (!answer && !isCoding) {
      const qText = newSnap.questionText || "";
      if (qText.includes("Choose the correct sentence regarding the project timeline")) {
        answer = "The project will be completed by next month if everything goes as planned.";
      } else if (qText.includes("Identify the grammatically correct sentence regarding the project team")) {
        answer = "The team of engineers is meeting to discuss the project.";
      } else if (qText.includes("In a coding competition, six programmers")) {
        answer = "F and A";
      } else if (qText.includes("In a team of five professionals, A, B, C, D, and E have distinct years")) {
        answer = "A and C";
      } else if (qText.includes("In a toy factory, there are five bins filled with different quantities")) {
        answer = "A";
      } else if (qText.includes("In a team of five individuals, A, B, C, D, and E, each has a different level")) {
        answer = "A and C";
      } else if (qText.includes("Is the number M divisible by 12?")) {
        answer = "Both statements together are sufficient";
      } else if (qText.includes("A woman is initially facing south.")) {
        answer = "East";
      } else if (qText.includes("Dear Richa Ma’am: I am still waiting")) {
        answer = "Dear Richa Ma’am:";
      } else if (qText.includes("recent experimental evidence has ________ its validity")) {
        answer = "corroborated";
      } else if (qText.includes("launch of the new software has been ________ until next month")) {
        answer = "deferred";
      }
      if (answer) {
        newSnap.answer = answer;
        newSnap.metadata.answer = answer;
        if (!newSnap.mcqData) newSnap.mcqData = {};
        newSnap.mcqData.correctAnswer = answer;
      }
    }

    return newSnap;
  }

  // 3. Fast Parallel Update for TestInstanceQuestion (batches of 50)
  const tiqs = await prisma.testInstanceQuestion.findMany();
  console.log(`Updating ${tiqs.length} TestInstanceQuestion records in chunks of 50...`);
  const CHUNK_SIZE = 50;
  for (let i = 0; i < tiqs.length; i += CHUNK_SIZE) {
    const chunk = tiqs.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(tiq => {
        const snap = (tiq.questionSnapshot || {}) as any;
        const enriched = enrichSnapshot(snap, tiq.questionId);
        return prisma.testInstanceQuestion.update({
          where: { id: tiq.id },
          data: { questionSnapshot: enriched }
        });
      })
    );
  }
  console.log(`Successfully updated ${tiqs.length} TestInstanceQuestion records.`);

  // 4. Fast Parallel Update for AssembledTestQuestion (batches of 50)
  const atqs = await prisma.assembledTestQuestion.findMany();
  console.log(`Updating ${atqs.length} AssembledTestQuestion records in chunks of 50...`);
  for (let i = 0; i < atqs.length; i += CHUNK_SIZE) {
    const chunk = atqs.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(atq => {
        const snap = (atq.questionSnapshot || {}) as any;
        const enriched = enrichSnapshot(snap, atq.questionId);
        return prisma.assembledTestQuestion.update({
          where: { id: atq.id },
          data: { questionSnapshot: enriched }
        });
      })
    );
  }
  console.log(`Successfully updated ${atqs.length} AssembledTestQuestion records.`);
}

syncAllFast().catch(console.error).finally(() => prisma.$disconnect());
