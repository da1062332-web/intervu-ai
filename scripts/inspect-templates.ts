import { connectPrisma, disconnectPrisma, prisma } from "../packages/database/src";

async function inspect() {
  await connectPrisma();
  try {
    const templates = await prisma.template.findMany({
      where: { deletedAt: null }
    });

    console.log(`Total Templates: ${templates.length}`);
    for (const t of templates) {
      console.log(`- [${t.conceptKey} - ${t.difficultyLevel}] Key: ${t.templateKey}, Active: ${t.isActive}`);
    }
  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await disconnectPrisma();
  }
}

inspect();
