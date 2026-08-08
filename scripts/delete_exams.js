const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const ids = ["hj3a4duk3ginlhj3x4f1jm1c", "cmrm058rx0007x6xcgyubztxa"];

  const models = Object.keys(prisma).filter(
    (k) => !k.startsWith("_") && !k.startsWith("$"),
  );

  let deletedCount = 0;
  for (const model of models) {
    if (typeof prisma[model].deleteMany === "function") {
      try {
        const result = await prisma[model].deleteMany({
          where: { id: { in: ids } },
        });
        if (result.count > 0) {
          console.log(`Deleted ${result.count} records from ${model}`);
          deletedCount += result.count;
        }
      } catch (e) {
        // Ignore errors (e.g. model doesn't have an 'id' field)
      }
    }
  }

  if (deletedCount === 0) {
    console.log("No records found with these IDs in any model.");
  } else {
    console.log(`Successfully deleted ${deletedCount} total records.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
