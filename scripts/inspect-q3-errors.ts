import { PrismaClient } from "@prisma/client";
import { SubmissionEvaluatorService } from "../apps/api/src/modules/coding/services/submission-evaluator.service";
import { JudgeService } from "../apps/api/src/modules/coding/services/judge.service";
import { OracleRegistry } from "../apps/api/src/modules/coding/oracles/oracle.registry";

const prisma = new PrismaClient();
const judgeService = new JudgeService();
const oracleRegistry = new OracleRegistry();
const evaluator = new SubmissionEvaluatorService(judgeService, oracleRegistry, prisma);

async function inspectQ3Errors() {
  const q3 = await prisma.question.findUnique({ where: { id: "cmt4bjjtz000htcvtfrcquk7y" } });
  const q3Code = `
def strStr(haystack: str, needle: str) -> int:
    return haystack.find(needle)
`;

  const q3Res = await evaluator.evaluateSubmission({
    questionId: q3!.id,
    language: "python",
    code: q3Code
  }, (q3!.codingData as any));

  console.log("Q3 Error Message:", q3Res.errorMessage);
  console.log("Q3 Results details:", JSON.stringify(q3Res.results, null, 2));
}

inspectQ3Errors().catch(console.error).finally(() => prisma.$disconnect());
