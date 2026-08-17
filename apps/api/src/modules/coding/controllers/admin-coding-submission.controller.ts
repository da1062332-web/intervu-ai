import { Controller, Get, Param, UseGuards, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@ApiTags("coding-admin")
@Controller("coding/admin")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.ADMIN)
export class AdminCodingSubmissionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("submissions/:testInstanceId")
  @ApiOperation({
    summary: "Retrieve candidate coding submissions for an assessment instance (Admin only)",
    description:
      "Fetches full evaluation records, source code, final verdicts, scores, and category pass rates for recruiter/admin audit.",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved candidate coding submissions",
  })
  @ApiResponse({ status: 404, description: "Assessment instance not found" })
  async getCandidateCodingSubmissions(@Param("testInstanceId") testInstanceId: string) {
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: testInstanceId },
      include: {
        candidateAnswers: true,
        user: true,
      },
    });

    if (!testInstance) {
      throw new NotFoundException(`Assessment instance ${testInstanceId} not found.`);
    }

    const codingAnswers = (testInstance.candidateAnswers || []).filter((ans) => {
      const ansObj = typeof ans.answer === "object" ? ans.answer : null;
      return ansObj && ("code" in ansObj || "submissionId" in ansObj);
    });

    const submissions = codingAnswers.map((ans) => {
      const ansObj = ans.answer as any;
      return {
        questionId: ans.questionId,
        verdict: ansObj?.verdict || "UNEVALUATED",
        score: typeof ansObj?.score === "number" ? ansObj.score : 0,
        language: ansObj?.language || "unknown",
        code: ansObj?.code || "",
        submissionId: ansObj?.submissionId || null,
        submittedAt: ansObj?.submittedAt || ans.updatedAt,
      };
    });

    return {
      testInstanceId: testInstance.id,
      candidateId: testInstance.userId,
      candidateName: (testInstance as any).user?.fullName || (testInstance as any).user?.name || "Candidate",
      status: testInstance.status,
      totalCodingQuestions: submissions.length,
      submissions,
    };
  }
}
