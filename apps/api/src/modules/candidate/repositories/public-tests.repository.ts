import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PublicTestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicTests(params: {
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
      company,
      difficulty,
      status,
      search,
      skip,
      take,
      sortBy,
      sortOrder,
    } = params;

    const examWhere: Prisma.ExamConfigWhereInput = {};
    const testWhere: Prisma.TestConfigWhereInput = {};

    if (company) {
      testWhere.companyName = { contains: company, mode: "insensitive" };
    }

    if (status === "active") {
      examWhere.isActive = true;
      testWhere.isActive = true;
    } else if (status === "inactive") {
      examWhere.isActive = false;
      testWhere.isActive = false;
    }

    if (search) {
      examWhere.OR = [{ name: { contains: search, mode: "insensitive" } }];
      testWhere.OR = [{ displayName: { contains: search, mode: "insensitive" } }];
    }

    const [totalExams, totalTests, exams, tests] = await Promise.all([
      this.prisma.examConfig.count({ where: examWhere }),
      this.prisma.testConfig.count({ where: testWhere }),
      this.prisma.examConfig.findMany({
        where: examWhere,
        include: { sections: { select: { name: true } } },
      }),
      this.prisma.testConfig.findMany({
        where: testWhere,
        include: { sections: { select: { displayName: true } } },
      }),
    ]);

    const total = totalExams + totalTests;

    let combined = [
      ...exams.map(e => ({ ...e, isExam: true })),
      ...tests.map(t => ({ ...t, isExam: false }))
    ];

    combined.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      // Handle the case where they have different field names for name
      if (sortBy === 'name') {
        valA = a.isExam ? a.name : a.displayName;
        valB = b.isExam ? b.name : b.displayName;
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const items = combined.slice(skip, skip + take);

    return { total, items };
  }
}
