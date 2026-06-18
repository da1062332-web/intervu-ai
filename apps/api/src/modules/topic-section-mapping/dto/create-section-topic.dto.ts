import { IsString, IsNotEmpty } from "class-validator";
import { CreateSectionTopicRequest } from "@intervu-ai/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSectionTopicDto implements CreateSectionTopicRequest {
  @ApiProperty({ description: "The UUID of the topic to map", example: "se-ds-001" })
  @IsString()
  @IsNotEmpty()
  topicId!: string;
}
