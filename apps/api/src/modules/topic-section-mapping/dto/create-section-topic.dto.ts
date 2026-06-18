import { IsUUID } from "class-validator";
import { CreateSectionTopicRequest } from "@intervu-ai/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSectionTopicDto implements CreateSectionTopicRequest {
  @ApiProperty({ description: "The UUID of the topic to map", example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID("4", { message: "topicId must be a valid UUID" })
  topicId!: string;
}
