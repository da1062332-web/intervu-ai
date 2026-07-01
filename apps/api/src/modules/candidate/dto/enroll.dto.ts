import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

/**
 * Request body for POST /api/v1/candidate/enroll
 */
export class EnrollRequestDto {
  @ApiProperty({
    example: "clx1abc123",
    description: "TestConfig ID to enroll in",
  })
  @IsString()
  @IsNotEmpty()
  testId!: string;
}

/**
 * Single enrollment item returned in responses.
 */
export class EnrollmentItemDto {
  @ApiProperty({ example: "clx_enroll_1" })
  id!: string;

  @ApiProperty({ example: "clx1abc123" })
  testId!: string;

  @ApiProperty({ example: "TCS NQT Assessment" })
  testName!: string;

  @ApiProperty({ example: "TCS" })
  company!: string;

  @ApiProperty({ example: "ENROLLED" })
  status!: string;

  @ApiProperty({ example: 3600 })
  durationSeconds!: number;

  @ApiProperty({ example: 10 })
  questionCount!: number;

  @ApiProperty({ example: "2026-07-01T10:00:00.000Z" })
  enrolledAt!: string;
}

/**
 * Response for POST /api/v1/candidate/enroll
 */
export class EnrollResponseDto {
  @ApiProperty({ type: EnrollmentItemDto })
  enrollment!: EnrollmentItemDto;
}

/**
 * Response for GET /api/v1/candidate/enrollments
 */
export class EnrollmentListResponseDto {
  @ApiProperty({ type: [EnrollmentItemDto] })
  enrollments!: EnrollmentItemDto[];
}
