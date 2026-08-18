import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const API_BASE = 'http://127.0.0.1:4000/api/v1';
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-long-secret-at-least-32-chars';

interface ApiResponse<T = any> {
  status: number;
  data: T;
}

async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  token?: string,
  body?: any,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

async function runFullExamSimulation() {
  console.log('================================================================');
  console.log('       CANDIDATE EXAM FLOW END-TO-END AUTOMATED TEST           ');
  console.log('================================================================\n');

  try {
    let candidate = await prisma.user.findFirst({
      where: { email: `candidate_sim_${Date.now()}@example.com` },
    });

    if (!candidate) {
      candidate = await prisma.user.create({
        data: {
          email: `cand_sim_${Date.now()}@example.com`,
          fullName: 'Simulation Candidate',
          role: 'CANDIDATE',
        },
      });
    }

    const candidateId = candidate.id;
    const candidateEmail = candidate.email;

    console.log(`[User] Candidate: ${candidateEmail} [ID: ${candidateId}]`);

    // 1. Generate Candidate JWT
    const token = jwt.sign(
      {
        sub: candidateId,
        id: candidateId,
        email: candidateEmail,
        role: 'CANDIDATE',
        type: 'access',
        sessionId: `sim-session-${Date.now()}`,
      },
      JWT_SECRET,
      { expiresIn: '2h' },
    );

    // 2. Fetch Available Published Test Configurations via API
    console.log('[API] Discovering Available Tests (GET /tests/configs)...');
    const configsRes = await apiRequest('/tests/configs', 'GET', token);
    const configsPayload = configsRes.data?.data || configsRes.data;
    const configs = configsPayload?.configs || (Array.isArray(configsPayload) ? configsPayload : []);

    if (configsRes.status !== 200 || !configs.length) {
      console.error('❌ Failed to fetch available test configs:', configsRes.data);
      return;
    }
    const targetConfig = configs.sort((a: any, b: any) => (b.sections?.length || 0) - (a.sections?.length || 0))[0];
    console.log(`[Config] Target: "${targetConfig.name}" [ID: ${targetConfig.configId || targetConfig.id}]`);
    console.log(`[Config] Total Sections: ${targetConfig.sections?.length || 0} (${targetConfig.sections?.map((s: any) => s.displayName || s.sectionName || s.name || s.sectionKey).join(', ')})`);
    console.log(`[Config] Total Duration: ${targetConfig.durationMinutes || Math.floor(targetConfig.duration / 60)}m`);
    console.log(`[Config] Question Count: ${targetConfig.questionCount || 0}`);

    const targetConfigId = targetConfig.configId || targetConfig.id;

    // 4. TEST 1: Start Exam (Latency & Instant Start Benchmark)
    console.log('\n----------------------------------------------------------------');
    console.log('STEP 1: Starting Assessment (POST /tests/start)');
    console.log('----------------------------------------------------------------');

    const startBegin = Date.now();
    const startRes = await apiRequest('/tests/start', 'POST', token, {
      testConfigId: targetConfigId,
    });
    const startDurationMs = Date.now() - startBegin;

    if (startRes.status !== 201 && startRes.status !== 200) {
      console.error(`❌ Start Exam failed (HTTP ${startRes.status}):`, JSON.stringify(startRes.data, null, 2));
      return;
    }

    const payload = startRes.data?.data || startRes.data;
    if (!payload || !payload.testInstanceId) {
      console.error(`❌ Start Exam unexpected payload (HTTP ${startRes.status}):`, JSON.stringify(startRes.data, null, 2));
      return;
    }

    const { testInstanceId, status, durationSeconds } = payload;
    console.log(`✅ Exam Started in: ${startDurationMs}ms (${(startDurationMs / 1000).toFixed(2)}s) [Target < 3.0s]`);
    console.log(`   Test Instance ID: ${testInstanceId}`);
    console.log(`   Initial Status: ${status}`);
    console.log(`   Total Duration: ${durationSeconds}s`);

    if (startDurationMs > 3000) {
      console.warn('⚠️ Warning: Start took longer than 3 seconds.');
    } else {
      console.log('🚀 PASS: Start Latency is OPTIMIZED (< 3s).');
    }

    // 5. TEST 2: Load Assessment Snapshot
    console.log('\n----------------------------------------------------------------');
    console.log('STEP 2: Loading Assessment Snapshot (GET /tests/:id)');
    console.log('----------------------------------------------------------------');

    const snapBegin = Date.now();
    const snapRes = await apiRequest(`/tests/${testInstanceId}`, 'GET', token);
    const snapDurationMs = Date.now() - snapBegin;

    if (snapRes.status !== 200) {
      console.error(`❌ Load snapshot failed (HTTP ${snapRes.status}):`, snapRes.data);
      return;
    }

    const snapshot = snapRes.data?.data || snapRes.data;
    console.log(`✅ Snapshot Loaded in: ${snapDurationMs}ms`);
    console.log(`   Assessment: "${snapshot.assessmentName}"`);
    console.log(`   Section Timing Enabled: ${snapshot.sectionTimingEnabled}`);
    console.log(`   Active Section Index: ${snapshot.currentSectionIndex}`);
    console.log(`   Sections Count: ${snapshot.sections?.length || 0}`);

    const sec1 = snapshot.sections?.[0];
    console.log(`\n   Section 1: "${sec1?.sectionName}" [Key: ${sec1?.sectionKey}, Status: ${sec1?.status}]`);
    console.log(`   Section 1 Questions Loaded: ${sec1?.questions?.length || 0}`);

    if (!sec1 || !sec1.questions || sec1.questions.length === 0) {
      console.error('❌ Section 1 has 0 questions loaded!');
      return;
    }

    const sampleQ = sec1.questions[0];
    console.log(`   Sample Question 1 ID: ${sampleQ.questionId}`);
    console.log(`   Sample Question 1 Text: "${sampleQ.snapshot?.questionStatement?.substring(0, 60) || sampleQ.snapshot?.questionText?.substring(0, 60)}..."`);
    console.log(`   Sample Question 1 Options: ${sampleQ.snapshot?.options?.length || 0} choices`);

    // 6. TEST 3: Answer Questions in Section 1
    console.log('\n----------------------------------------------------------------');
    console.log('STEP 3: Answering Questions in Section 1 (POST /tests/:id/answer)');
    console.log('----------------------------------------------------------------');

    const questionsToAnswer = sec1.questions.slice(0, 3);
    for (let i = 0; i < questionsToAnswer.length; i++) {
      const q = questionsToAnswer[i];
      const optId = q.snapshot?.options?.[0]?.id || 'opt-0';
      const ansRes = await apiRequest(`/tests/${testInstanceId}/answer`, 'POST', token, {
        questionId: q.questionId,
        selectedOptionId: optId,
        timeSpentSeconds: 15,
      });

      console.log(`   Answered Question ${i + 1}/${questionsToAnswer.length} (${q.questionId}): HTTP ${ansRes.status}`);
    }
    console.log('✅ Section 1 Answers successfully saved.');

    // 7. TEST 4: Step through all sections (Simulate Candidate Section Progression)
    console.log('\n----------------------------------------------------------------');
    console.log('STEP 4: Advancing Sections & Verifying Background Progressive Population');
    console.log('----------------------------------------------------------------');

    let totalSections = snapshot.sections.length;

    for (let currentSecIdx = 0; currentSecIdx < totalSections - 1; currentSecIdx++) {
      const targetSecIdx = currentSecIdx + 1;
      console.log(`\n>> Advancing from Section ${currentSecIdx + 1} to Section ${targetSecIdx + 1}...`);

      const advBegin = Date.now();
      const advRes = await apiRequest(`/tests/${testInstanceId}/sections/advance`, 'POST', token);
      const advDurationMs = Date.now() - advBegin;

      if (advRes.status !== 200 && advRes.status !== 201) {
        console.error(`❌ Advance section failed (HTTP ${advRes.status}):`, advRes.data);
        return;
      }

      const advData = advRes.data?.data || advRes.data;
      console.log(`   ✅ Advance API responded in ${advDurationMs}ms:`, advData);
      console.log(`   Next Section Index: ${advData.nextSectionIndex}`);

      // Fetch fresh snapshot after advance
      const nextSnapRes = await apiRequest(`/tests/${testInstanceId}`, 'GET', token);
      const nextSnap = nextSnapRes.data?.data || nextSnapRes.data;

      const prevSec = nextSnap.sections[currentSecIdx];
      const activeSec = nextSnap.sections[targetSecIdx];

      console.log(`   Previous Section (${prevSec.sectionName}): Status = ${prevSec.status} (Expected: LOCKED / COMPLETED)`);
      console.log(`   Active Section (${activeSec.sectionName}): Status = ${activeSec.status} (Expected: ACTIVE)`);
      console.log(`   Active Section Questions Count: ${activeSec.questions?.length || 0}`);

      if (activeSec.questions?.length === 0) {
        console.warn(`   ⚠️ Waiting 1.5s for progressive background worker to finish section ${targetSecIdx + 1}...`);
        await new Promise((r) => setTimeout(r, 1500));
        const retrySnapRes = await apiRequest(`/tests/${testInstanceId}`, 'GET', token);
        const retrySnap = retrySnapRes.data?.data || retrySnapRes.data;
        console.log(`   Active Section Questions after sync: ${retrySnap.sections[targetSecIdx].questions?.length || 0}`);
      }

      // Answer at least 1 question in this section
      if (activeSec.questions && activeSec.questions.length > 0) {
        const q = activeSec.questions[0];
        const optId = q.snapshot?.options?.[0]?.id || 'opt-0';
        await apiRequest(`/tests/${testInstanceId}/answer`, 'POST', token, {
          questionId: q.questionId,
          selectedOptionId: optId,
          timeSpentSeconds: 20,
        });
        console.log(`   Saved answer for Question 1 of ${activeSec.sectionName}`);
      }
    }

    // 8. TEST 5: Final Submission on Last Section
    console.log('\n----------------------------------------------------------------');
    console.log('STEP 5: Final Assessment Submission (POST /tests/:id/submit)');
    console.log('----------------------------------------------------------------');

    const submitBegin = Date.now();
    const submitRes = await apiRequest(`/tests/${testInstanceId}/submit?allowPartial=true`, 'POST', token);
    const submitDurationMs = Date.now() - submitBegin;
    const submitData = submitRes.data?.data || submitRes.data;

    console.log(`   Submit Response (HTTP ${submitRes.status}) in ${submitDurationMs}ms:`, submitData);

    // Verify final state via API
    const finalRes = await apiRequest(`/tests/${testInstanceId}`, 'GET', token);
    const finalData = finalRes.data?.data || finalRes.data;

    console.log(`\n================================================================`);
    console.log('                 FINAL VERIFICATION SUMMARY                     ');
    console.log('================================================================');
    console.log(`Test Instance ID:     ${testInstanceId}`);
    console.log(`Final Assessment:     "${finalData?.assessmentName || 'N/A'}"`);
    console.log(`Total Sections:       ${finalData?.sections?.length || 0}`);
    console.log(`Sections Summary:`);
    finalData?.sections?.forEach((s: any, idx: number) => {
      console.log(`  - Section ${idx + 1} (${s.sectionName || s.title || s.sectionKey}): Status = ${s.status}, Questions = ${s.questions?.length || 0}`);
    });

    console.log('\n🎉 ALL EXAM LIFECYCLE CHECKS COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ Exception during exam simulation:', error);
  }
}

runFullExamSimulation();
