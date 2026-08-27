import { PrismaClient } from "@prisma/client";
import { SubmissionEvaluatorService } from "../apps/api/src/modules/coding/services/submission-evaluator.service";
import { JudgeService } from "../apps/api/src/modules/coding/services/judge.service";
import { OracleRegistry } from "../apps/api/src/modules/coding/oracles/oracle.registry";

const prisma = new PrismaClient();
const judgeService = new JudgeService();
const oracleRegistry = new OracleRegistry();
const evaluator = new SubmissionEvaluatorService(judgeService, oracleRegistry, prisma);

async function testCodingQuestions() {
  console.log("==================================================");
  console.log("TESTING ALL 3 CODING QUESTIONS AGAINST EVALUATOR");
  console.log("==================================================");

  // 1. Q1: Step Accumulator (Python)
  const q1 = await prisma.question.findUnique({ where: { id: "cmt4bgn6s000fzju63untxp9j" } });
  const q1Code = `
def accumulate(initial: int, operations: list) -> int:
    curr = initial
    for item in operations:
        op, val = item['op'], item['val']
        if op == 'ADD': curr += val
        elif op == 'SUBTRACT': curr -= val
        elif op == 'MULTIPLY': curr *= val
    return curr
`;
  console.log("\nEvaluating Q1 (Step Accumulator - Python)...");
  const q1Res = await evaluator.evaluateSubmission({
    questionId: q1!.id,
    language: "python",
    code: q1Code
  }, (q1!.codingData as any));
  console.log("Q1 Verdict:", q1Res.verdict, `(Score: ${q1Res.score})`);
  console.log("Q1 Summary:", JSON.stringify(q1Res.categories));

  // 2. Q2: Two Sum in Sorted Array (Python)
  const q2 = await prisma.question.findUnique({ where: { id: "cmt4bj5rx0001tcvtl13lpqv0" } });
  const q2Code = `
def twoSumSorted(numbers: list[int], target: int) -> list[int]:
    l, r = 0, len(numbers) - 1
    while l < r:
        s = numbers[l] + numbers[r]
        if s == target:
            return [l + 1, r + 1]
        elif s < target:
            l += 1
        else:
            r -= 1
    return []
`;
  console.log("\nEvaluating Q2 (Two Sum - Python)...");
  const q2Res = await evaluator.evaluateSubmission({
    questionId: q2!.id,
    language: "python",
    code: q2Code
  }, (q2!.codingData as any));
  console.log("Q2 Verdict:", q2Res.verdict, `(Score: ${q2Res.score})`);
  console.log("Q2 Summary:", JSON.stringify(q2Res.categories));

  // 3. Q3: Needle in Haystack (Python)
  const q3 = await prisma.question.findUnique({ where: { id: "cmt4bjjtz000htcvtfrcquk7y" } });
  const q3Code = `
def strStr(haystack: str, needle: str) -> int:
    return haystack.find(needle)
`;
  console.log("\nEvaluating Q3 (Needle in Haystack - Python)...");
  const q3Res = await evaluator.evaluateSubmission({
    questionId: q3!.id,
    language: "python",
    code: q3Code
  }, (q3!.codingData as any));
  console.log("Q3 Verdict:", q3Res.verdict, `(Score: ${q3Res.score})`);
  console.log("Q3 Summary:", JSON.stringify(q3Res.categories));
}

testCodingQuestions().catch(console.error).finally(() => prisma.$disconnect());
