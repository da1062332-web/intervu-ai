import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CreateStyleProfile,
  UpdateStyleProfile,
  StyleCharacteristic,
  StyleProfileSchema,
} from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateStyleProfileDto implements CreateStyleProfile {
  @ApiProperty({ example: "Campus Placement Profile", maxLength: 150 })
  name!: string;

  @ApiPropertyOptional({ example: "Standard assessment style for entry-level developers" })
  description?: string | null;

  @ApiProperty({ example: "campus", enum: ["campus", "lateral", "executive", "certification"] })
  profileType!: "campus" | "lateral" | "executive" | "certification";

  @ApiProperty({
    example: [
      { name: "questionLength", value: "short" },
      { name: "complexity", value: "low" },
    ],
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        value: { type: "object" },
      },
    },
  })
  characteristics!: StyleCharacteristic[];

  @ApiPropertyOptional({ example: true })
  active?: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateStyleProfileDto> {
    return StyleProfileSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateStyleProfileDto>;
  }
}

export class UpdateStyleProfileDto implements UpdateStyleProfile {
  @ApiPropertyOptional({ example: "Experienced Hiring Profile" })
  name?: string;

  @ApiPropertyOptional({ example: "Updated description for lateral hiring" })
  description?: string | null;

  @ApiPropertyOptional({ example: "lateral", enum: ["campus", "lateral", "executive", "certification"] })
  profileType?: "campus" | "lateral" | "executive" | "certification";

  @ApiPropertyOptional({
    example: [
      { name: "questionLength", value: "long" },
      { name: "complexity", value: "high" },
    ],
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        value: { type: "object" },
      },
    },
  })
  characteristics?: StyleCharacteristic[];

  @ApiPropertyOptional({ example: true })
  active?: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateStyleProfileDto> {
    return StyleProfileSchema.partial().safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateStyleProfileDto>;
  }
}
