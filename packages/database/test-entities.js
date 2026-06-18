const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const mappings = await prisma.sectionTopic.findMany({
    where: { sectionId: "cmqjdmp4w0004ps999fzfylts" },
  });
  console.log("Mappings:", mappings);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
