import { prisma } from '../packages/database/src';

export async function auditDay4Candidates() {
  console.log('================================================================');
  console.log('Day 4 Master 500-Candidate Assessment Audit & Verification');
  console.log('================================================================\n');

  // 1. Candidate Accounts
  const candidates = await prisma.user.findMany({
    where: { email: { contains: 'skillitrix-loadtest.invalid' } },
    select: { id: true, email: true, createdAt: true }
  });
  console.log(`Total loadtest candidates found: ${candidates.length}`);

  const candidateIds = candidates.map(c => c.id);

  // 2. Assessment Instances
  const instances = await prisma.testInstance.findMany({
    where: { userId: { in: candidateIds } },
    select: {
      id: true,
      userId: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const statusCounts: Record<string, number> = {};
  instances.forEach(i => {
    statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
  });
  console.log(`Test Instances created: ${instances.length}`);
  console.log('Status distribution:', statusCounts);

  const instanceIds = instances.map(i => i.id);

  // 3. Answers Persisted
  const totalAnswers = await prisma.candidateAnswer.count({
    where: { testInstanceId: { in: instanceIds } }
  });
  console.log(`Candidate answers persisted in DB: ${totalAnswers}`);

  // Coding answers persisted
  let codingAnswersCount = 0;
  if (instanceIds.length > 0) {
    const allAnswers = await prisma.candidateAnswer.findMany({
      where: { testInstanceId: { in: instanceIds } },
      select: { answer: true }
    });
    codingAnswersCount = allAnswers.filter(a => {
      const str = typeof a.answer === 'string' ? a.answer : JSON.stringify(a.answer || {});
      return str.includes('matrixDiagonalSums');
    }).length;
  }
  console.log(`Coding solutions autosaved: ${codingAnswersCount}`);

  // 4. Duplicate Session Audit
  const userInstanceMap = new Map<string, number>();
  instances.forEach(i => {
    userInstanceMap.set(i.userId, (userInstanceMap.get(i.userId) || 0) + 1);
  });
  let duplicateSessions = 0;
  userInstanceMap.forEach(count => {
    if (count > 1) duplicateSessions++;
  });
  console.log(`Duplicate sessions / attempts detected: ${duplicateSessions}`);

  // 5. Section Transitions
  const sections = await prisma.testInstanceSection.findMany({
    where: { testInstanceId: { in: instanceIds } },
    select: { id: true, status: true }
  });
  console.log(`Section instances initialized/advanced: ${sections.length}`);

  // 6. Submissions & Evaluations
  const submissions = await prisma.submission.findMany({
    where: { testInstanceId: { in: instanceIds } },
    select: {
      id: true,
      testInstanceId: true,
      status: true,
      submittedAt: true,
      isAutoSubmit: true
    }
  });
  console.log(`Total submissions recorded: ${submissions.length}`);

  const candidateResults = await prisma.candidateResult.findMany({
    where: { attemptId: { in: instanceIds } },
    select: { id: true, score: true, percentage: true, qualification: true }
  });
  console.log(`Total candidate results generated: ${candidateResults.length}`);

  // 7. Platform Real Users Safety Check
  const realUsers = await prisma.user.count({
    where: { email: { not: { contains: 'skillitrix-loadtest.invalid' } } }
  });
  console.log(`Real platform users safely preserved: ${realUsers}`);

  await prisma.$disconnect();

  return {
    candidatesCount: candidates.length,
    instancesCount: instances.length,
    statusCounts,
    totalAnswers,
    codingAnswersCount,
    duplicateSessions,
    submissionsCount: submissions.length,
    resultsCount: candidateResults.length,
    realUsers
  };
}

if (require.main === module) {
  auditDay4Candidates().catch(console.error);
}
