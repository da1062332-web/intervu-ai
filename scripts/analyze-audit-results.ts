import * as fs from "fs";

interface QuestionAuditResult {
  id: string;
  type: string;
  topicName?: string;
  topicCode?: string;
  conceptName?: string;
  difficulty: string;
  status: "VALID" | "NEEDS_FIX" | "INVALID";
  highestSeverity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  issues: {
    check: string;
    severity: string;
    problem: string;
    expected: string;
    actual: string;
    recommendedFix: string;
  }[];
  questionSnippet: string;
  answerSnippet: string;
}

const raw = fs.readFileSync("entire_dataset_audit_results.json", "utf-8");
const results: QuestionAuditResult[] = JSON.parse(raw);

const checkCounts: Record<string, { count: number; severity: string; examples: any[] }> = {};
const statusCounts: Record<string, number> = { VALID: 0, NEEDS_FIX: 0, INVALID: 0 };
const typeCounts: Record<string, { total: number; valid: number; needsFix: number; invalid: number }> = {};

for (const r of results) {
  statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;

  if (!typeCounts[r.type]) {
    typeCounts[r.type] = { total: 0, valid: 0, needsFix: 0, invalid: 0 };
  }
  typeCounts[r.type].total++;
  if (r.status === "VALID") typeCounts[r.type].valid++;
  if (r.status === "NEEDS_FIX") typeCounts[r.type].needsFix++;
  if (r.status === "INVALID") typeCounts[r.type].invalid++;

  for (const iss of r.issues) {
    if (!checkCounts[iss.check]) {
      checkCounts[iss.check] = { count: 0, severity: iss.severity, examples: [] };
    }
    checkCounts[iss.check].count++;
    if (checkCounts[iss.check].examples.length < 3) {
      checkCounts[iss.check].examples.push({
        id: r.id,
        topic: r.topicName,
        problem: iss.problem,
        actual: iss.actual
      });
    }
  }
}

console.log("=== STATUS BREAKDOWN ===");
console.log(statusCounts);

console.log("\n=== BY QUESTION TYPE ===");
console.log(typeCounts);

console.log("\n=== BREAKDOWN OF ISSUE CHECKS ===");
console.log(JSON.stringify(checkCounts, null, 2));
