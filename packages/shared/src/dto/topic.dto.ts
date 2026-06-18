import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateTopic, UpdateTopic } from "@intervu-ai/contracts";
import { CreateTopicSchema, UpdateTopicSchema } from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateTopicDto implements CreateTopic {
  @ApiProperty({ example: "Software Engineering" })
  domain!: string;

  @ApiProperty({ example: "Data Structures" })
  topicName!: string;

  @ApiProperty({ example: "Arrays & Hashing" })
  subtopic!: string;

  @ApiProperty({ example: ["arrays", "hashing"] })
  tags!: string[];

  @ApiPropertyOptional({ example: true, default: true })
  easySupport!: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  mediumSupport!: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  hardSupport!: boolean;

  static validate(data: unknown): z.SafeParseReturnType<unknown, CreateTopicDto> {
    return CreateTopicSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, CreateTopicDto>;
  }
}

export class UpdateTopicDto implements UpdateTopic {
  @ApiPropertyOptional({ example: "Software Engineering" })
  domain?: string;

  @ApiPropertyOptional({ example: "Algorithms" })
  topicName?: string;

  @ApiPropertyOptional({ example: "Sorting" })
  subtopic?: string;

  @ApiPropertyOptional({ example: ["sorting"] })
  tags?: string[];

  @ApiPropertyOptional({ example: true })
  easySupport?: boolean;

  @ApiPropertyOptional({ example: true })
  mediumSupport?: boolean;

  @ApiPropertyOptional({ example: true })
  hardSupport?: boolean;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  static validate(data: unknown): z.SafeParseReturnType<unknown, UpdateTopicDto> {
    return UpdateTopicSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, UpdateTopicDto>;
  }
}
