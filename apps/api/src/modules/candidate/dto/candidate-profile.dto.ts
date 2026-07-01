import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

/**
 * Response for GET /api/v1/candidate/profile
 */
export class CandidateProfileResponseDto {
  @ApiProperty({ example: "clxuser123" })
  id!: string;

  @ApiProperty({ example: "john@example.com" })
  email!: string;

  @ApiPropertyOptional({ example: "John Doe" })
  name!: string | null;

  @ApiPropertyOptional({ example: "+91-9876543210" })
  phone!: string | null;

  @ApiPropertyOptional({ example: "IIT Bombay" })
  college!: string | null;

  @ApiPropertyOptional({ example: 2026 })
  graduationYear!: number | null;

  @ApiProperty({ example: "CANDIDATE" })
  role!: string;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  createdAt!: string;
}

/**
 * Request body for PUT /api/v1/candidate/profile
 */
export class UpdateCandidateProfileDto {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "+91-9876543210" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "IIT Bombay" })
  @IsOptional()
  @IsString()
  college?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2040)
  graduationYear?: number;
}
