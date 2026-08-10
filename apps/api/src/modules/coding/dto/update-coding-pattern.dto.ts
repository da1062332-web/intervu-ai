import { PartialType } from "@nestjs/mapped-types";
import { CreateCodingPatternDto } from "./create-coding-pattern.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateCodingPatternDto extends PartialType(
  CreateCodingPatternDto,
) {
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
