import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from "class-validator";
import { Type } from "class-transformer";

/**
 * Query parameters for GET /api/v1/tests/public
 */
export class PublicTestsQueryDto {
  @ApiPropertyOptional({
    example: "TCS",
    description: "Filter by company name",
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    example: "MEDIUM",
    description: "Filter by difficulty",
    enum: ["EASY", "MEDIUM", "HARD"],
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: "Frontend", description: "Filter by role" })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    example: "active",
    description: "Filter by status",
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: "react assessment",
    description: "Search by title, role, or tag",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: "Page number" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: "Items per page",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "displayName",
    default: "displayName",
    description: "Sort field",
  })
  @IsOptional()
  @IsString()
  @IsIn(["displayName", "companyName", "totalDurationSeconds", "createdAt"])
  sortBy?: string = "displayName";

  @ApiPropertyOptional({
    example: "asc",
    default: "asc",
    description: "Sort order",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "asc";
}
