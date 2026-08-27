import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function auditAllCodingTestSuites() {
  console.log("==================================================");
  console.log("DATABASE-WIDE AUDIT OF CODING TEST SUITES (PUBLIC, HIDDEN, BOUNDARY, STRESS)");
  console.log("==================================================");

  // 1. Question Table
  const bankCoding = await prisma.question.findMany({
    where: { questionType: "CODING" }
  });
  console.log(`\n--- 1. QUESTION TABLE (${bankCoding.length} Coding Questions) ---`);
  let bankMissingHidden = 0;
  let bankMissingBoundary = 0;
  let bankMissingStress = 0;
  let bankMissingPublic = 0;
  let bankAllValid = 0;

  for (const q of bankCoding) {
    const cd = (q.codingData || {}) as any;
    const meta = (q.metadata || {}) as any;
    const pub = cd.publicTests || meta.publicTests || [];
    const hid = cd.hiddenTests || meta.hiddenTests || [];
    const bnd = cd.boundaryTests || meta.boundaryTests || [];
    const str = cd.stressTests || meta.stressTests || [];

    let hasIssue = false;
    if (!Array.isArray(pub) || pub.length === 0) { bankMissingPublic++; hasIssue = true; }
    if (!Array.isArray(hid) || hid.length === 0) { bankMissingHidden++; hasIssue = true; }
    if (!Array.isArray(bnd) || bnd.length === 0) { bankMissingBoundary++; hasIssue = true; }
    if (!Array.isArray(str) || str.length === 0) { bankMissingStress++; hasIssue = true; }

    if (!hasIssue) {
      bankAllValid++;
    } else {
      console.log(`  [ISSUE] Question ${q.id} (${q.questionTitle || q.questionText.substring(0, 30)}): pub=${pub.length}, hid=${hid.length}, bnd=${bnd.length}, str=${str.length}`);
    }
  }

  console.log(`Question Table Summary:`);
  console.log(`  Fully Complete (Public + Hidden + Boundary + Stress): ${bankAllValid} / ${bankCoding.length}`);
  console.log(`  Missing Public: ${bankMissingPublic}`);
  console.log(`  Missing Hidden: ${bankMissingHidden}`);
  console.log(`  Missing Boundary: ${bankMissingBoundary}`);
  console.log(`  Missing Stress: ${bankMissingStress}`);

  // 2. AssembledTestQuestion Table
  const atqs = await prisma.assembledTestQuestion.findMany({
    where: {
      OR: [
        { section: { sectionName: { contains: "coding", mode: "insensitive" } } },
        { questionSnapshot: { path: ["questionType"], equals: "CODING" } }
      ]
    }
  });
  console.log(`\n--- 2. ASSEMBLED_TEST_QUESTIONS TABLE (${atqs.length} Coding Snapshots) ---`);
  let atqMissingHidden = 0;
  let atqMissingBoundary = 0;
  let atqMissingStress = 0;
  let atqMissingPublic = 0;
  let atqAllValid = 0;

  for (const atq of atqs) {
    const snap = (atq.questionSnapshot || {}) as any;
    const cd = snap.codingData || {};
    const meta = snap.metadata || {};
    const pub = cd.publicTests || meta.publicTests || [];
    const hid = cd.hiddenTests || meta.hiddenTests || [];
    const bnd = cd.boundaryTests || meta.boundaryTests || [];
    const str = cd.stressTests || meta.stressTests || [];

    let hasIssue = false;
    if (!Array.isArray(pub) || pub.length === 0) { atqMissingPublic++; hasIssue = true; }
    if (!Array.isArray(hid) || hid.length === 0) { atqMissingHidden++; hasIssue = true; }
    if (!Array.isArray(bnd) || bnd.length === 0) { atqMissingBoundary++; hasIssue = true; }
    if (!Array.isArray(str) || str.length === 0) { atqMissingStress++; hasIssue = true; }

    if (!hasIssue) {
      atqAllValid++;
    } else {
      console.log(`  [ISSUE] ATQ ${atq.id} (QID: ${atq.questionId}): pub=${pub.length}, hid=${hid.length}, bnd=${bnd.length}, str=${str.length}`);
    }
  }

  console.log(`AssembledTestQuestion Summary:`);
  console.log(`  Fully Complete: ${atqAllValid} / ${atqs.length}`);
  console.log(`  Missing Public: ${atqMissingPublic}`);
  console.log(`  Missing Hidden: ${atqMissingHidden}`);
  console.log(`  Missing Boundary: ${atqMissingBoundary}`);
  console.log(`  Missing Stress: ${atqMissingStress}`);

  // 3. TestInstanceQuestion Table
  const tiqs = await prisma.testInstanceQuestion.findMany({
    where: {
      OR: [
        { section: { sectionName: { contains: "coding", mode: "insensitive" } } },
        { questionSnapshot: { path: ["questionType"], equals: "CODING" } }
      ]
    }
  });
  console.log(`\n--- 3. TEST_INSTANCE_QUESTION TABLE (${tiqs.length} Coding Snapshots) ---`);
  let tiqMissingHidden = 0;
  let tiqMissingBoundary = 0;
  let tiqMissingStress = 0;
  let tiqMissingPublic = 0;
  let tiqAllValid = 0;

  for (const tiq of tiqs) {
    const snap = (tiq.questionSnapshot || {}) as any;
    const cd = snap.codingData || {};
    const meta = snap.metadata || {};
    const pub = cd.publicTests || meta.publicTests || [];
    const hid = cd.hiddenTests || meta.hiddenTests || [];
    const bnd = cd.boundaryTests || meta.boundaryTests || [];
    const str = cd.stressTests || meta.stressTests || [];

    let hasIssue = false;
    if (!Array.isArray(pub) || pub.length === 0) { tiqMissingPublic++; hasIssue = true; }
    if (!Array.isArray(hid) || hid.length === 0) { tiqMissingHidden++; hasIssue = true; }
    if (!Array.isArray(bnd) || bnd.length === 0) { tiqMissingBoundary++; hasIssue = true; }
    if (!Array.isArray(str) || str.length === 0) { tiqMissingStress++; hasIssue = true; }

    if (!hasIssue) {
      tiqAllValid++;
    } else {
      console.log(`  [ISSUE] TIQ ${tiq.id} (QID: ${tiq.questionId}): pub=${pub.length}, hid=${hid.length}, bnd=${bnd.length}, str=${str.length}`);
    }
  }

  console.log(`TestInstanceQuestion Summary:`);
  console.log(`  Fully Complete: ${tiqAllValid} / ${tiqs.length}`);
  console.log(`  Missing Public: ${tiqMissingPublic}`);
  console.log(`  Missing Hidden: ${tiqMissingHidden}`);
  console.log(`  Missing Boundary: ${tiqMissingBoundary}`);
  console.log(`  Missing Stress: ${tiqMissingStress}`);
}

auditAllCodingTestSuites().catch(console.error).finally(() => prisma.$disconnect());
