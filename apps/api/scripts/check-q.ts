import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const q = await prisma.question.findFirst({
      where: { source: "GENERATED", topic: { concepts: { some: { name: { contains: "Verbal" } } } } }
    });
    if (q) {
      console.log("Question ID:", q.id);
      console.log("Options:", q.options);
      console.log("Metadata keys:", Object.keys(q.metadata || {}));
      console.log("Metadata datasetItem:", (q.metadata as any)?.datasetItem ? "Exists" : "Undefined");
    } else {
      console.log("No Question found.");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
