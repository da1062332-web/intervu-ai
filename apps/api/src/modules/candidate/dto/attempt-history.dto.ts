import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Single attempt item in the history response.
 */
export class AttemptItemDto {
  @ApiProperty({ example: "clx9xyz789" })
  instanceId!: string;

  @ApiProperty({ example: "TCS NQT Assessment" })
  assessmentName!: string;

  @ApiProperty({ example: "2026-06-08T04:00:00.000Z" })
  date!: string;

  @ApiProperty({ example: 82, nullable: true })
  score!: number | null;

  @ApiProperty({ example: "COMPLETED" })
  status!: string;

  @ApiProperty({ example: 1 })
  attemptNumber!: number;

  @ApiProperty({
    example: 3600,
    nullable: true,
    description: "Duration in seconds",
  })
  durationSeconds!: number | null;
}

/**
 * Pagination metadata.
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

/**
 * Response for GET /api/v1/candidate/attempts
 */
export class AttemptHistoryResponseDto {
  @ApiProperty({ type: [AttemptItemDto] })
  attempts!: AttemptItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination!: PaginationMetaDto;
}
