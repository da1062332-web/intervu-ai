import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

export class CreateScenarioDto {
  @ApiProperty({ description: "Name of the logic scenario template", example: "Blood Relations Seeding" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "Detailed description of logic scenario", example: "Generates father-son-brother links" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Entity properties and naming pool schemas", example: { names: ["Rohan", "Amit", "Neha"] } })
  @IsObject()
  @IsNotEmpty()
  entitySchema!: Record<string, any>;

  @ApiProperty({ description: "Valid relationship edges mapping", example: { relations: ["brother", "father"] } })
  @IsObject()
  @IsNotEmpty()
  relationSchema!: Record<string, any>;

  @ApiPropertyOptional({ description: "Graph integrity rules", example: { acyclic: true, depth: 3 } })
  @IsObject()
  @IsOptional()
  rules?: Record<string, any>;
}

export class UpdateScenarioDto {
  @ApiPropertyOptional({ description: "Name of the logic scenario template" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Detailed description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Entity properties schemas" })
  @IsObject()
  @IsOptional()
  entitySchema?: Record<string, any>;

  @ApiPropertyOptional({ description: "Valid relationship edges" })
  @IsObject()
  @IsOptional()
  relationSchema?: Record<string, any>;

  @ApiPropertyOptional({ description: "Graph integrity rules" })
  @IsObject()
  @IsOptional()
  rules?: Record<string, any>;
}
