import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Utility function that queries the latest readiness report to determine
 * if the exam config is fully READY for question generation.
 */
export async function canGenerateExam(configId: string): Promise<boolean> {
  try {
    const latestReport = await prisma.readinessReport.findFirst({
      where: { configId },
      orderBy: { createdAt: "desc" },
    });
    return latestReport?.status === "READY";
  } catch {
    return false;
  }
}
