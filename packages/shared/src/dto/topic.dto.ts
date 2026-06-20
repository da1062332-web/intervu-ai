import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateTopic, UpdateTopic } from "@intervu-ai/contracts";
import { CreateTopicSchema, UpdateTopicSchema } from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateTopicDto implements CreateTopic {
  @ApiProperty({ example: "Data Structures" })
  name!: string;

  @ApiProperty({ example: "DATA_STRUCTURES" })
  code!: string;

  @ApiPropertyOptional({ example: "Topic covering data structures and algorithms" })
  description?: string | null;

  @ApiPropertyOptional({ example: "ACTIVE" })
  status?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateTopicDto> {
    return CreateTopicSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateTopicDto>;
  }
}

export class UpdateTopicDto implements UpdateTopic {
  @ApiPropertyOptional({ example: "Advanced Data Structures" })
  name?: string;

  @ApiPropertyOptional({ example: "DATA_STRUCTURES_ADV" })
  code?: string;

  @ApiPropertyOptional({ example: "Updated description text" })
  description?: string | null;

  @ApiPropertyOptional({ example: "ACTIVE" })
  status?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateTopicDto> {
    return UpdateTopicSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateTopicDto>;
  }
}
