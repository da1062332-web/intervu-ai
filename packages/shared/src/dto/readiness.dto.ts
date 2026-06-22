import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ReadinessCheck,
  ReadinessCheckStatus,
  ReadinessReportResponse,
  ReadinessReportResponseSchema,
} from "@intervu-ai/contracts";
import { z } from "zod";

export class ReadinessCheckDto implements ReadinessCheck {
  @ApiProperty({ example: "Topics Assigned" })
  name!: string;

  @ApiProperty({ example: "PASS", enum: ["PASS", "FAIL", "WARNING"] })
  status!: ReadinessCheckStatus;

  @ApiPropertyOptional({ example: "Check passed successfully" })
  message?: string;
}

export class ReadinessReportResponseDto implements ReadinessReportResponse {
  @ApiProperty({ example: 85 })
  score!: number;

  @ApiProperty({
    example: "PARTIALLY_READY",
    enum: ["NOT_READY", "PARTIALLY_READY", "READY"],
  })
  status!: "NOT_READY" | "PARTIALLY_READY" | "READY";

  @ApiProperty({ type: [ReadinessCheckDto] })
  checks!: ReadinessCheckDto[];

  @ApiPropertyOptional({ example: {} })
  report?: unknown;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, ReadinessReportResponseDto> {
    return ReadinessReportResponseSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, ReadinessReportResponseDto>;
  }
}
