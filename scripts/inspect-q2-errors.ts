import { PrismaClient } from "@prisma/client";
import { SubmissionEvaluatorService } from "../apps/api/src/modules/coding/services/submission-evaluator.service";
import { JudgeService } from "../apps/api/src/modules/coding/services/judge.service";
import { OracleRegistry } from "../apps/api/src/modules/coding/oracles/oracle.registry";

const prisma = new PrismaClient();
const judgeService = new JudgeService();
const oracleRegistry = new OracleRegistry();
const evaluator = new SubmissionEvaluatorService(judgeService, oracleRegistry, prisma);

async function inspectQ2Errors() {
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

  const q2Res = await evaluator.evaluateSubmission({
    questionId: q2!.id,
    language: "python",
    code: q2Code
  }, (q2!.codingData as any));

  console.log("Q2 Error Message:", q2Res.errorMessage);
  console.log("Q2 Results details:", JSON.stringify(q2Res.results, null, 2));
}

inspectQ2Errors().catch(console.error).finally(() => prisma.$disconnect());
