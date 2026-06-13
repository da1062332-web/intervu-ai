import { EvaluationEngineService } from "../packages/ai-core/src/evaluation/evaluation-engine.service";
import { QuestionSnapshot } from "../packages/ai-core/src/evaluation/score-calculator.service";
import { ExecutionResult } from "@intervu-ai/contracts";

async function runAudit() {
  console.log("==========================================");
  console.log("Running Evaluation Accuracy Audit (50 Known Answer Sets)");
  console.log("==========================================\n");

  const evaluationEngine = new EvaluationEngineService();
  let passes = 0;
  let failures = 0;

  // Programmatically build 50 known answer sets
  const scenarios: Array<{
    name: string;
    questions: QuestionSnapshot[];
    answers: Array<{ questionId: string; answer: string }>;
    expectedOverallScore: number;
    expectedConfidenceScore: number;
    expectedSkillScores: Record<string, number>;
  }> = [];

  // Generate 50 test scenarios
  for (let i = 1; i <= 50; i++) {
    const questions: QuestionSnapshot[] = [];
    const answers: Array<{ questionId: string; answer: string }> = [];

    if (i <= 10) {
      // 1-question cases (Scenarios 1 to 10)
      const qId = `q_single_${i}`;
      const correctVal = i % 2 === 0 ? "40" : "Option A";
      const qType = i % 2 === 0 ? "numeric" : "mcq";
      const concept = i % 2 === 0 ? "time_work" : "probability"; // time_work -> aptitude, probability -> reasoning
      const skill = i % 2 === 0 ? "aptitude" : "reasoning";

      questions.push({
        questionId: qId,
        correctAnswer: correctVal,
        questionType: qType,
        conceptKey: concept,
        difficultyLevel: "easy",
      });

      let candidateAns = "";
      let expectedScore = 0;
      let expectedConfidence = 0;

      if (i % 3 === 1) {
        // Correct answer
        candidateAns = correctVal;
        expectedScore = 100;
        expectedConfidence = 100;
      } else if (i % 3 === 2) {
        // Incorrect answer
        candidateAns = "incorrect_val";
        expectedScore = 0;
        expectedConfidence = 100;
      } else {
        // Empty answer
        candidateAns = "   ";
        expectedScore = 0;
        expectedConfidence = 0;
      }

      answers.push({ questionId: qId, answer: candidateAns });

      scenarios.push({
        name: `Scenario ${i} (1-question ${qType} test, ans: "${candidateAns.trim()}")`,
        questions,
        answers,
        expectedOverallScore: expectedScore,
        expectedConfidenceScore: expectedConfidence,
        expectedSkillScores: expectedConfidence > 0 ? { [skill]: expectedScore } : {},
      });

    } else if (i <= 20) {
      // 2-question cases (Scenarios 11 to 20)
      const q1Id = `q1_${i}`;
      const q2Id = `q2_${i}`;

      questions.push(
        {
          questionId: q1Id,
          correctAnswer: "20",
          questionType: "numeric",
          conceptKey: "percentages", // -> aptitude
          difficultyLevel: "medium",
        },
        {
          questionId: q2Id,
          correctAnswer: "Option B",
          questionType: "mcq",
          conceptKey: "probability", // -> reasoning
          difficultyLevel: "medium",
        }
      );

      // We vary candidate answers:
      // i = 11: both correct -> 100% score, 100% confidence
      // i = 12: both incorrect -> 0% score, 100% confidence
      // i = 13: one correct, one incorrect -> 50% score, 100% confidence
      // i = 14: one correct, one empty -> 50% score, 50% confidence
      // i = 15: both empty -> 0% score, 0% confidence
      // i = 16: correct with extra spaces/caps -> 100% score, 100% confidence
      // i = 17: correct with decimal precision for numeric -> 100% score, 100% confidence
      // and repeat.
      let ans1 = "";
      let ans2 = "";
      let expScore = 0;
      let expConfidence = 0;
      let expSkills: Record<string, number> = {};

      const mod = i % 7;
      if (mod === 1) {
        ans1 = "20";
        ans2 = "Option B";
        expScore = 100;
        expConfidence = 100;
        expSkills = { aptitude: 100, reasoning: 100 };
      } else if (mod === 2) {
        ans1 = "999";
        ans2 = "Wrong Option";
        expScore = 0;
        expConfidence = 100;
        expSkills = { aptitude: 0, reasoning: 0 };
      } else if (mod === 3) {
        ans1 = "20";
        ans2 = "Wrong Option";
        expScore = 50;
        expConfidence = 100;
        expSkills = { aptitude: 100, reasoning: 0 };
      } else if (mod === 4) {
        ans1 = "20";
        ans2 = "";
        expScore = 50;
        expConfidence = 50;
        expSkills = { aptitude: 100 }; // Only answered has skill rating computed if reasoning is unrated/0? Actually, if unanswered, it counts as incorrect so reasoning score is 0.
        // Wait! Let's check how SkillEvaluatorService handles unanswered questions.
        // In skill-evaluator.service.ts, it loops over all questions in questionsMap.
        // So even if the answer is empty, it adds 1 to stats.total, and isCorrect is false.
        // Therefore, reasoning will have total = 1, correct = 0, so score = 0%.
        expSkills = { aptitude: 100, reasoning: 0 };
      } else if (mod === 5) {
        ans1 = "";
        ans2 = "";
        expScore = 0;
        expConfidence = 0;
        expSkills = { aptitude: 0, reasoning: 0 };
      } else if (mod === 6) {
        ans1 = "  20.000  ";
        ans2 = " OPTION B ";
        expScore = 100;
        expConfidence = 100;
        expSkills = { aptitude: 100, reasoning: 100 };
      } else {
        ans1 = "20.00005"; // numeric within 0.0001 tolerance
        ans2 = "option b";
        expScore = 100;
        expConfidence = 100;
        expSkills = { aptitude: 100, reasoning: 100 };
      }

      answers.push({ questionId: q1Id, answer: ans1 }, { questionId: q2Id, answer: ans2 });

      scenarios.push({
        name: `Scenario ${i} (2-question test, ans1: "${ans1.trim()}", ans2: "${ans2.trim()}")`,
        questions,
        answers,
        expectedOverallScore: expScore,
        expectedConfidenceScore: expConfidence,
        expectedSkillScores: expSkills,
      });

    } else if (i <= 40) {
      // Multi-question cases (Scenarios 21 to 40)
      // We generate a test with i - 15 questions (6 to 25 questions)
      const qCount = i - 15;
      
      // Let's create qCount questions, all in concept "percentages" (aptitude)
      for (let k = 1; k <= qCount; k++) {
        questions.push({
          questionId: `q_${i}_${k}`,
          correctAnswer: `ans_${k}`,
          questionType: "mcq",
          conceptKey: "percentages",
          difficultyLevel: "medium",
        });
      }

      // We make the candidate answer exactly the first k_correct questions correctly
      // i = 21 (6 questions) -> k_correct = 2 -> score = 2/6 = 33.33% -> round to 33%
      // confidence: all answered -> 100%
      const k_correct = i % qCount;
      for (let k = 1; k <= qCount; k++) {
        const candidateAns = k <= k_correct ? `ans_${k}` : "wrong_ans";
        answers.push({ questionId: `q_${i}_${k}`, answer: candidateAns });
      }

      const expectedScore = Math.round((k_correct / qCount) * 100);

      scenarios.push({
        name: `Scenario ${i} (${qCount}-question test, ${k_correct} correct)`,
        questions,
        answers,
        expectedOverallScore: expectedScore,
        expectedConfidenceScore: 100,
        expectedSkillScores: { aptitude: expectedScore },
      });

    } else {
      // Mixed skill and custom cases (Scenarios 41 to 50)
      // Let's create a 4-question test:
      // Q1, Q2: concept "time_work" -> aptitude
      // Q3, Q4: concept "probability" -> reasoning
      questions.push(
        { questionId: "qa1", correctAnswer: "A", questionType: "mcq", conceptKey: "time_work", difficultyLevel: "easy" },
        { questionId: "qa2", correctAnswer: "B", questionType: "mcq", conceptKey: "time_work", difficultyLevel: "easy" },
        { questionId: "qr1", correctAnswer: "C", questionType: "mcq", conceptKey: "probability", difficultyLevel: "easy" },
        { questionId: "qr2", correctAnswer: "D", questionType: "mcq", conceptKey: "probability", difficultyLevel: "easy" }
      );

      // Vary the answers:
      // i = 41: Q1, Q3 correct -> score 50%, aptitude 50%, reasoning 50%
      // i = 42: Q1, Q2 correct -> score 50%, aptitude 100%, reasoning 0%
      // i = 43: Q3, Q4 correct -> score 50%, aptitude 0%, reasoning 100%
      // i = 44: All correct -> score 100%, aptitude 100%, reasoning 100%
      // i = 45: None correct -> score 0%, aptitude 0%, reasoning 0%
      // and so on.
      let ansVal: string[] = [];
      let expScore = 0;
      let expApt = 0;
      let expReason = 0;
      let expConf = 100;

      const caseIndex = i - 40;
      if (caseIndex === 1) {
        ansVal = ["A", "X", "C", "X"];
        expScore = 50;
        expApt = 50;
        expReason = 50;
      } else if (caseIndex === 2) {
        ansVal = ["A", "B", "X", "X"];
        expScore = 50;
        expApt = 100;
        expReason = 0;
      } else if (caseIndex === 3) {
        ansVal = ["X", "X", "C", "D"];
        expScore = 50;
        expApt = 0;
        expReason = 100;
      } else if (caseIndex === 4) {
        ansVal = ["A", "B", "C", "D"];
        expScore = 100;
        expApt = 100;
        expReason = 100;
      } else if (caseIndex === 5) {
        ansVal = ["X", "X", "X", "X"];
        expScore = 0;
        expApt = 0;
        expReason = 0;
      } else if (caseIndex === 6) {
        // 1 unanswered in each skill
        ansVal = ["A", "", "C", ""];
        expScore = 50;
        expApt = 50;
        expReason = 50;
        expConf = 50; // 2/4 answered
      } else {
        // general fallback
        ansVal = ["A", "B", "C", "X"];
        expScore = 75;
        expApt = 100;
        expReason = 50;
      }

      answers.push(
        { questionId: "qa1", answer: ansVal[0] },
        { questionId: "qa2", answer: ansVal[1] },
        { questionId: "qr1", answer: ansVal[2] },
        { questionId: "qr2", answer: ansVal[3] }
      );

      scenarios.push({
        name: `Scenario ${i} (Mixed Skill test, case ${caseIndex})`,
        questions,
        answers,
        expectedOverallScore: expScore,
        expectedConfidenceScore: expConf,
        expectedSkillScores: { aptitude: expApt, reasoning: expReason },
      });
    }
  }

  // Run all 50 scenarios
  for (let idx = 0; idx < scenarios.length; idx++) {
    const scenario = scenarios[idx];
    const execResult: ExecutionResult = {
      executionId: `exec_${idx + 1}`,
      testId: `test_${idx + 1}`,
      status: "submitted",
      answers: scenario.answers,
      submittedAt: new Date(),
    };

    try {
      const actualResult = await evaluationEngine.evaluate(execResult, scenario.questions);

      const scoreMatch = actualResult.overallScore === scenario.expectedOverallScore;
      const confMatch = actualResult.confidenceScore === scenario.expectedConfidenceScore;
      
      let skillsMatch = true;
      for (const [skill, expectedVal] of Object.entries(scenario.expectedSkillScores)) {
        if (actualResult.skillScores[skill] !== expectedVal) {
          skillsMatch = false;
          break;
        }
      }

      if (scoreMatch && confMatch && skillsMatch) {
        passes++;
      } else {
        failures++;
        console.error(`❌ Scenario #${idx + 1} "${scenario.name}" FAILED:`);
        console.error(`   Expected: Score=${scenario.expectedOverallScore}%, Conf=${scenario.expectedConfidenceScore}%, Skills=${JSON.stringify(scenario.expectedSkillScores)}`);
        console.error(`   Actual:   Score=${actualResult.overallScore}%, Conf=${actualResult.confidenceScore}%, Skills=${JSON.stringify(actualResult.skillScores)}`);
      }
    } catch (err: any) {
      failures++;
      console.error(`❌ Scenario #${idx + 1} "${scenario.name}" FAILED with Exception:`, err.message);
    }
  }

  console.log("==========================================");
  console.log("Evaluation Audit Summary");
  console.log(`PASS: ${passes} / FAIL: ${failures}`);
  console.log("==========================================\n");

  if (failures > 0) {
    console.error("❌ EVALUATION ACCURACY AUDIT FAILED");
    process.exit(1);
  } else {
    console.log("EVALUATION PASS");
    process.exit(0);
  }
}

runAudit();
