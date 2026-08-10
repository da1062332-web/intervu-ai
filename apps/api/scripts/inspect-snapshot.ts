import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const q = await prisma.question.findUnique({
    where: { id: "cms00j5kf000zvvi2tq01of0d" },
  });
  console.log("QUESTION DATA:");
  console.log(JSON.stringify(q, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
