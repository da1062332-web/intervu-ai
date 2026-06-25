import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class GenerationAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    prompt: string;
    response: string;
    qualityScore: number;
    validationResult: any;
  }): Promise<any> {
    return this.prisma.generationAuditLog.create({
      data: {
        prompt: params.prompt,
        response: params.response,
        qualityScore: params.qualityScore,
        validationResult: params.validationResult,
      },
    });
  }
}
