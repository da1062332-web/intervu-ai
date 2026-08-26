import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectSample() {
  const sample = await prisma.question.findMany({
    where: {
      id: { in: [
        "cmsn0reat0040oaork5ho4d57",
        "cmsn4mz4l0025pz7lyfpslroo",
        "cmsn4nvms0032pz7ljb4g9zwx"
      ]}
    }
  });

  for (const q of sample) {
    console.log("==========================================");
    console.log("ID:", q.id);
    console.log("Text:", q.questionText);
    console.log("Answer:", q.answer);
    console.log("MCQ Data:", JSON.stringify(q.mcqData, null, 2));
    console.log("Metadata:", JSON.stringify(q.metadata, null, 2));
  }
}

inspectSample().catch(console.error).finally(() => prisma.$disconnect());
