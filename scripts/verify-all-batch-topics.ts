import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Verification of Batch Readiness Fixes ===");

  const checks = [
    { name: "Idioms and phrases", reqs: [{ diff: "MEDIUM", req: 2 }, { diff: "HARD", req: 1 }] },
    { name: "Statements and Conclusion", reqs: [{ diff: "EASY", req: 2 }] },
    { name: "Number Series", reqs: [{ diff: "EASY", req: 2 }] },
    { name: "Time & Work", reqs: [{ diff: "EASY", req: 2 }] },
    { name: "Time, Speed & Distance", reqs: [{ diff: "EASY", req: 2 }] },
    { name: "Profit & Loss", reqs: [{ diff: "EASY", req: 2 }] },
  ];

  for (const c of checks) {
    const topic = await prisma.topic.findFirst({
      where: { OR: [{ name: c.name }, { code: c.name.toUpperCase().replace(/[^A-Z0-9]/g, "_") }] },
    });

    console.log(`\nTopic: '${c.name}' (${topic?.id ?? "Not Found"})`);

    if (topic) {
      for (const r of c.reqs) {
        const count = await prisma.question.count({
          where: { topicId: topic.id, difficulty: r.diff, status: "ACTIVE" },
        });
        const passed = count >= r.req;
        console.log(`  - Active ${r.diff} Questions: ${count} (Required: ${r.req}) -> ${passed ? "PASSED ✅" : "FAILED ❌"}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
