import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { WorkflowStatus, WorkflowStep } from "@prisma/client";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class WorkflowFilterDto {
  @ApiPropertyOptional({ description: "Search by exam name or examId" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WorkflowStatus })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional({ enum: WorkflowStep })
  @IsOptional()
  @IsEnum(WorkflowStep)
  step?: WorkflowStep;

  @ApiPropertyOptional({ description: "Created after this date (ISO string)" })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ description: "Created before this date (ISO string)" })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({ description: "Updated after this date (ISO string)" })
  @IsOptional()
  @IsDateString()
  updatedAfter?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({ enum: ["createdAt", "updatedAt", "status"] })
  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "status"])
  sortBy?: "createdAt" | "updatedAt" | "status";

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
