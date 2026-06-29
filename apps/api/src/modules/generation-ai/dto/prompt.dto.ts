import { IsNotEmpty, IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePromptDto {
  @ApiProperty({ example: "Quantitative Aptitude" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "quantitative" })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: "Generate one question on {topic}." })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdatePromptDto {
  @ApiProperty({ example: "Updated content for prompt", required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
