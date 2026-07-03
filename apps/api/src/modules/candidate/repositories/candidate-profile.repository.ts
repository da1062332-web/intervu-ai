import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CandidateProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        college: true,
        graduationYear: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      college?: string;
      graduationYear?: number;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        college: true,
        graduationYear: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
