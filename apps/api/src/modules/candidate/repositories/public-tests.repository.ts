import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

function computeDifficulty(item: any, isExam: boolean): string {
  if (isExam && item.difficultyDistribution) {
    const {
      easyPercentage = 0,
      mediumPercentage = 0,
      hardPercentage = 0,
    } = item.difficultyDistribution;
    if (easyPercentage > mediumPercentage && easyPercentage > hardPercentage)
      return "Easy";
    if (hardPercentage > mediumPercentage && hardPercentage > easyPercentage)
      return "Hard";
    return "Medium";
  }
  const text = (
    (isExam ? item.name : item.displayName) +
    " " +
    (item.role || item.companyName || "")
  ).toLowerCase();
  if (
    text.includes("easy") ||
    text.includes("basic") ||
    text.includes("junior") ||
    text.includes("beginner") ||
    text.includes("fundamental") ||
    text.includes("intern")
  ) {
    return "Easy";
  }
  if (
    text.includes("hard") ||
    text.includes("advanced") ||
    text.includes("senior") ||
    text.includes("architect") ||
    text.includes("principal") ||
    text.includes("expert") ||
    text.includes("lead")
  ) {
    return "Hard";
  }
  const nameStr = String(isExam ? item.name : item.displayName || "");
  const charSum = nameStr
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const mod = charSum % 3;
  if (mod === 0) return "Easy";
  if (mod === 2) return "Hard";
  return "Medium";
}

@Injectable()
export class PublicTestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicTests(params: {
    userId: string;
    company?: string;
    difficulty?: string;
    status?: string;
    search?: string;
    skip: number;
    take: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) {
    const {
      userId,
      company,
      difficulty,
      status,
      search,
      skip,
      take,
      sortBy,
      sortOrder,
    } = params;

    const examWhere: Prisma.ExamConfigWhereInput = { 
      status: { in: ["PUBLISHED", "ACTIVE", "VALIDATED"] },
      isArchived: false,
      isActive: true,
    };

    if (status === "active") {
      examWhere.isActive = true;
    } else if (status === "inactive") {
      examWhere.isActive = false;
    }

    if (search) {
      examWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const exams = await this.prisma.examConfig.findMany({
      where: examWhere,
      include: {
        sections: { select: { name: true, questionCount: true } },
        difficultyDistribution: true,
        ruleFlags: true,
        testInstances: { where: { userId }, select: { id: true } },
      },
    });

    let combined = exams.map((e) => ({
      ...e,
      isExam: true,
      difficulty: computeDifficulty(e, true),
    }));

    if (difficulty && difficulty.toLowerCase() !== "all") {
      combined = combined.filter(
        (item) => item.difficulty.toLowerCase() === difficulty.toLowerCase(),
      );
    }

    combined.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle the case where they have different field names for name
      if (sortBy === "name") {
        valA = a.isExam ? a.name : a.displayName;
        valB = b.isExam ? b.name : b.displayName;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const total = combined.length;
    const items = combined.slice(skip, skip + take);

    return { total, items };
  }
}
